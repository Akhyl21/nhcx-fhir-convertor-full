const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const logger = require('../utils/logger');

function getCSVParser() {
  try {
    return require('csv-parse/sync').parse;
  } catch {
    return null;
  }
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parseFn = getCSVParser();

  const records = parseFn
    ? parseFn(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true
      })
    : manualParseCSV(content);

  if (!records || records.length === 0) {
    throw new Error('CSV is empty or invalid');
  }

  return {
    headers: Object.keys(records[0]),
    rows: records,
    format: 'csv',
    totalRows: records.length
  };
}

function manualParseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (values[i] || '').trim();
    });
    return row;
  }).filter(r => Object.values(r).some(v => v));
}

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQ = false;

  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }

  result.push(cur);
  return result;
}

function parseExcel(filePath) {
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws, { defval: '', raw: false });

  if (!data.length) throw new Error('Excel sheet is empty');

  return {
    headers: Object.keys(data[0]),
    rows: data,
    format: 'excel',
    totalRows: data.length
  };
}

async function parseXML(filePath) {
  const xml2js = require('xml2js');
  const content = fs.readFileSync(filePath, 'utf-8');

  const result = await xml2js.parseStringPromise(content, {
    explicitArray: false,
    mergeAttrs: true,
    explicitRoot: true,
    trim: true
  });

  let records = [];

  if (result.FHIRDemoDataset?.Record) {
    records = Array.isArray(result.FHIRDemoDataset.Record)
      ? result.FHIRDemoDataset.Record
      : [result.FHIRDemoDataset.Record];
  } else if (result.Record) {
    records = Array.isArray(result.Record) ? result.Record : [result.Record];
  } else if (result.records?.Record) {
    records = Array.isArray(result.records.Record)
      ? result.records.Record
      : [result.records.Record];
  } else {
    records = [result];
  }

  const rows = records.map(r => flattenObject(r));

  if (!rows.length || !Object.keys(rows[0]).length) {
    throw new Error('XML is empty or invalid');
  }

  return {
    headers: Object.keys(rows[0]),
    rows,
    format: 'xml',
    totalRows: rows.length
  };
}

function parseJSON(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  let rows = Array.isArray(data)
    ? data
    : data.records
      ? data.records
      : data.data
        ? Array.isArray(data.data)
          ? data.data
          : [data.data]
        : [data];

  rows = rows.map(r => flattenObject(r));

  return {
    headers: rows.length ? Object.keys(rows[0]) : [],
    rows,
    format: 'json',
    totalRows: rows.length
  };
}

function parseHL7(filePath) {
  return parseHL7String(fs.readFileSync(filePath, 'utf-8'));
}

function parseHL7String(content) {
  const messages = splitHL7Messages(content);
  const rows = [];
  let totalSegments = 0;

  for (const message of messages) {
    const lines = message.split(/\r?\n|\r/).filter(s => s.trim());
    const row = {};
    let segCount = 0;

    for (const seg of lines) {
      const f = seg.split('|');
      const type = f[0];
      segCount++;
      totalSegments++;

      if (type === 'PID') {
        row.patientId = cx(f[3]);
        row.patientName = hl7Name(f[5]);
        row.dob = hl7Date(f[7]);
        row.gender = normalizeGender(f[8]);
        row.address = hl7Address(f[11]);
        row.phone = cleanPhone(f[13]);
        row.abhaId = f[19] || '';
      }

      else if (type === 'PV1') {
        row.patientClass = f[2] || '';

        row.hospitalizationType = {
          E: 'Emergency',
          U: 'Urgent',
          R: 'Routine',
          I: 'In-patient',
          O: 'Out-patient',
          IP: 'In-patient',
          OP: 'Out-patient'
        }[f[2]] || f[2] || '';

        const locParts = (f[3] || '').split('^');
        row.ward = locParts[0] || '';
        row.room = locParts[1] || '';
        row.bed = locParts[2] || '';

        const possibleHospital =
          f[39] ||
          f[41] ||
          locParts[3] ||
          '';

        if (possibleHospital && !isVisitCode(possibleHospital)) {
          row.hospitalName = possibleHospital;
        }

        row.admissionDate = hl7Date(f[44]);
        row.dischargeDate = hl7Date(f[45]);
      }

      else if (type === 'IN1') {
        const policyCandidate = f[2] || f[36] || f[49] || '';
        const insurerCandidate = xon(f[4]) || cx(f[3]) || '';

        if (policyCandidate && !looksLikeInsurerName(policyCandidate)) {
          row.policyNumber = policyCandidate;
        }

        row.insurerId = cx(f[3]);

        if (insurerCandidate && !looksLikePolicy(insurerCandidate)) {
          row.insurerName = insurerCandidate;
        }

        row.policyStartDate = hl7Date(f[12]);
        row.policyEndDate = hl7Date(f[13]);
        row.memberId = f[36] || f[49] || '';
        row.sumInsured = cleanAmount(f[38]);

        row.relationship = {
          '1': 'Self',
          '2': 'Spouse',
          '3': 'Child',
          SEL: 'Self',
          SPS: 'Spouse',
          CHD: 'Child',
          DEP: 'Dependent'
        }[f[17]] || f[17] || 'Self';

        if (!row.patientName && f[16]) {
          row.patientName = hl7Name(f[16]);
        }
      }

      else if (type === 'DG1') {
        const parts = (f[3] || '').split('^');
        const code = parts[0] || '';
        const name = parts[1] || f[4] || '';

        if (!row.icdCode) {
          row.icdCode = code;
          row.diagnosisName = name;
        } else {
          let i = 2;
          while (row[`icdCode${i}`]) i++;
          row[`icdCode${i}`] = code;
          row[`diagnosisName${i}`] = name;
        }
      }

      else if (type === 'PR1') {
        const parts = (f[3] || '').split('^');

        row.procedureCode = parts[0] || '';
        row.procedureName = parts[1] || f[4] || '';
        row.performedDate = hl7Date(f[5]);
      }

      else if (type === 'ZIN' || type === 'ZCL') {
        row.claimId = f[1] || row.claimId || '';

        const amountCandidate = f[2] || f[9] || f[10] || f[11] || '';
        row.claimedAmount = cleanAmount(amountCandidate);

        row.claimDate = hl7Date(f[3]);
        row.hospitalId = !isVisitCode(f[4]) ? (f[4] || '') : '';
        row.rohiniId = f[5] || '';

        if (f[6] && !isVisitCode(f[6]) && !looksLikePolicy(f[6])) {
          row.hospitalName = f[6];
        }

        if (f[7] && !looksLikePolicy(f[7]) && !isVisitCode(f[7])) {
          row.insurerName = f[7];
        }

        if (f[8] && looksLikePolicy(f[8])) {
          row.policyNumber = f[8];
        }

        row.item1Name = row.procedureName || 'Medical Service';
        row.item1Amount = row.claimedAmount;
        row.item1Quantity = 1;
        row.item1Code = row.procedureCode || '';
      }
    }

    if (!row.patientName && row.patientId) row.patientName = row.patientId;
    if (!row.hospitalName) row.hospitalName = 'Hospital';
    if (!row.insurerName) row.insurerName = 'Insurance Company';

    if (Object.keys(row).length > 0) {
      row._hl7Segments = segCount;
      rows.push(row);
    }
  }

  if (!rows.length) throw new Error('HL7 is empty or invalid');

  return {
    headers: Object.keys(rows[0]),
    rows,
    format: 'hl7',
    totalRows: rows.length,
    hl7Segments: totalSegments
  };
}

function splitHL7Messages(content) {
  const normalized = String(content || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const parts = normalized.split(/\n(?=MSH\|)/).map(p => p.trim()).filter(Boolean);
  return parts.length ? parts : [normalized];
}

function cx(value) {
  if (!value) return '';
  return value.split('^')[0] || '';
}

function xon(value) {
  if (!value) return '';
  return value.split('^')[0] || '';
}

function hl7Name(value) {
  if (!value) return '';

  const p = value.split('^');
  const family = p[0] || '';
  const given = p[1] || '';
  const middle = p[2] || '';

  return [given, middle, family].filter(Boolean).join(' ').trim();
}

function hl7Address(value) {
  if (!value) return '';
  return value.split('^').filter(Boolean).join(', ');
}

function hl7Date(value) {
  if (!value) return '';

  const d = String(value).replace(/\D/g, '');
  if (d.length < 8) return '';

  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

function normalizeGender(value) {
  if (!value) return '';

  const v = String(value).toUpperCase();

  if (v === 'M') return 'male';
  if (v === 'F') return 'female';
  if (v === 'O') return 'other';

  return v.toLowerCase();
}

function cleanPhone(value) {
  if (!value) return '';
  return String(value).replace(/\D/g, '').slice(-10);
}

function cleanAmount(value) {
  if (!value) return 0;

  const num = Number(
    String(value)
      .replace(/,/g, '')
      .replace(/[^\d.-]/g, '')
  );

  if (!Number.isFinite(num)) return 0;

  return Math.max(0, num);
}

function flattenObject(obj, prefix = '', result = {}) {
  if (!obj || typeof obj !== 'object') {
    if (prefix) result[prefix] = obj;
    return result;
  }

  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}_${k}` : k;

    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flattenObject(v, key, result);
    } else if (Array.isArray(v)) {
      result[key] = v
        .map(i => typeof i === 'object' ? JSON.stringify(i) : i)
        .join(', ');
    } else {
      result[key] = v;
    }
  }

  return result;
}

function looksLikePolicy(value) {
  return /^POL/i.test(String(value || '').trim());
}

function looksLikeInsurerName(value) {
  const v = String(value || '').toLowerCase();
  return (
    v.includes('insurance') ||
    v.includes('health') ||
    v.includes('ergo') ||
    v.includes('bupa') ||
    v.includes('star') ||
    v.includes('aig') ||
    v.includes('lombard') ||
    v.includes('allianz') ||
    v.includes('reliance') ||
    v.includes('sbi')
  );
}

function isVisitCode(value) {
  return ['ip', 'op', 'i', 'o', 'inpatient', 'outpatient', 'in-patient', 'out-patient']
    .includes(String(value || '').trim().toLowerCase());
}

async function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  logger.info(`Parsing: ${path.basename(filePath)} (${ext})`);

  if (ext === '.csv') return parseCSV(filePath);
  if (ext === '.xlsx' || ext === '.xls') return parseExcel(filePath);
  if (ext === '.xml') return await parseXML(filePath);
  if (ext === '.json') return parseJSON(filePath);
  if (ext === '.hl7' || ext === '.txt') return parseHL7(filePath);

  throw new Error(`Unsupported format: ${ext}`);
}

module.exports = {
  parseFile,
  parseCSV,
  parseExcel,
  parseXML,
  parseJSON,
  parseHL7,
  parseHL7String
};