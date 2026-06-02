const {
  buildPatient, buildOrganization, buildCoverage,
  buildCondition, buildProcedure, buildEncounter,
  buildCoverageEligibilityRequest,
  buildClaim, buildCommunication, buildBundle, makeReference
} = require('../models/fhirBuilders');

const llmService = require('../llm/llmService');
const logger = require('../utils/logger');

async function convertToFHIR(mappedData, useCase, options = {}) {
  logger.info(`Converting ${useCase} with ${mappedData.length} record(s)`);

  const bundles = [];

  for (const record of mappedData) {
    const cleanedRecord = sanitizeRecord(record);

    try {
      const bundle = await buildUseCaseBundle(cleanedRecord, useCase, options);
      bundles.push(bundle);
    } catch (err) {
      logger.error(`Error converting record: ${err.message}`);
      throw err;
    }
  }

  return bundles;
}

async function buildUseCaseBundle(data, useCase, options = {}) {
  const resources = [];

  const patientResult = buildPatient(data);
  resources.push(patientResult);

  const patientDisplay =
    data.patientName ||
    data.memberName ||
    data.insuredName ||
    data.subscriberName ||
    data.patientId ||
    'Unknown Patient';

  const patientRef = makeReference('Patient', patientResult.id, patientDisplay);

  const providerName =
    data.hospitalName ||
    data.providerName ||
    data.facilityName ||
    'Hospital';

  const providerData = {
    orgId: data.hospitalId || data.providerId,
    orgName: providerName,
    hospitalName: providerName,
    providerName,
    rohiniId: data.rohiniId,
    gstin: data.gstin
  };

  const providerResult = buildOrganization(providerData, 'provider');
  resources.push(providerResult);
  const providerRef = makeReference('Organization', providerResult.id, providerName);

  const insurerName =
    data.insurerName ||
    data.insuranceCompany ||
    data.tpaName ||
    'Insurance Company';

  const insurerData = {
    orgId: data.insurerId,
    insurerId: data.insurerId,
    orgName: insurerName,
    insurerName
  };

  const insurerResult = buildOrganization(insurerData, 'insurer');
  resources.push(insurerResult);
  const insurerRef = makeReference('Organization', insurerResult.id, insurerName);

  const coverageResult = buildCoverage(data, patientRef, insurerRef);
  resources.push(coverageResult);
  const coverageRef = makeReference('Coverage', coverageResult.id);

  const conditionRefs = [];
  const diagnoses = extractDiagnoses(data);

  for (const diag of diagnoses) {
    const condResult = buildCondition(diag, patientRef);
    resources.push(condResult);
    conditionRefs.push(makeReference('Condition', condResult.id, diag.diagnosisName || diag.icdCode));
  }

  const procedureRefs = [];
  const procedures = extractProcedures(data);

  for (const proc of procedures) {
    const procResult = buildProcedure(proc, patientRef);
    resources.push(procResult);
    procedureRefs.push(makeReference('Procedure', procResult.id, proc.procedureName || proc.procedureCode));
  }

  const refs = {
    patient: patientRef,
    provider: providerRef,
    insurer: insurerRef,
    coverage: coverageRef,
    conditions: conditionRefs,
    procedures: procedureRefs
  };

  if (useCase === 'coverage-eligibility') {
    const cerResult = buildCoverageEligibilityRequest(data, refs);
    resources.push(cerResult);
  }

  else if (useCase === 'claim' || useCase === 'preauth') {
    const encounterResult = buildEncounter(data, patientRef, providerRef);
    resources.push(encounterResult);
    refs.encounter = makeReference('Encounter', encounterResult.id);

    const claimData = { ...data, useCase };
    claimData.items = extractBillingItems(data);

    const claimResult = buildClaim(claimData, refs);
    resources.push(claimResult);
    refs.claim = makeReference('Claim', claimResult.id);

    if (data.notes || data.message || data.attachments) {
      const commResult = buildCommunication(data, refs);
      resources.push(commResult);
    }
  }

  else if (useCase === 'communication') {
    const commResult = buildCommunication(data, refs);
    resources.push(commResult);
  }

  const bundle = buildBundle(useCase, resources);

  if (options.validateWithLLM && (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY)) {
    try {
      const validation = await llmService.validateAndSuggest(bundle);
      bundle._validation = validation;
    } catch (e) {
      logger.warn('LLM validation skipped:', e.message);
    }
  }

  return bundle;
}

function sanitizeRecord(record = {}) {
  const data = { ...record };

  const badPatientValues = [
    data.hospitalName,
    data.providerName,
    data.procedureName,
    data.serviceName,
    data.item1Name,
    data.item2Name,
    data.item3Name,
    data.hospitalizationType,
    'Hemodialysis',
    'Pharmacy & Medications',
    'Rainbow Hospital',
    'IP',
    'OP'
  ].filter(Boolean).map(v => String(v).trim().toLowerCase());

  if (data.patientName && badPatientValues.includes(String(data.patientName).trim().toLowerCase())) {
    data.patientName =
      data.memberName ||
      data.insuredName ||
      data.subscriberName ||
      data.patientId ||
      '';
  }

  if (!data.patientName && (data.memberName || data.insuredName || data.subscriberName)) {
    data.patientName = data.memberName || data.insuredName || data.subscriberName;
  }

  if (data.hospitalName && ['ip', 'op', 'inpatient', 'outpatient'].includes(String(data.hospitalName).toLowerCase())) {
    data.hospitalName = data.providerName || data.facilityName || 'Hospital';
  }

  if (!data.hospitalName && data.providerName) {
    data.hospitalName = data.providerName;
  }

  if (!data.insurerName && data.insuranceCompany) {
    data.insurerName = data.insuranceCompany;
  }

  data.claimedAmount = toNumber(data.claimedAmount || data.totalAmount || data.serviceAmount);

  return data;
}

function applyMapping(row, mapping) {
  const mapped = {};

  for (const [sourceKey, targetKey] of Object.entries(mapping || {})) {
    if (targetKey && row[sourceKey] !== undefined && row[sourceKey] !== '') {
      mapped[targetKey] = row[sourceKey];
    }
  }

  return sanitizeRecord(mapped);
}

function extractDiagnoses(data) {
  const diagnoses = [];

  if (data.icdCode || data.diagnosisName || data.diagnosisCode) {
    diagnoses.push({
      icdCode: data.icdCode || data.diagnosisCode,
      diagnosisName: data.diagnosisName || data.icdCode || data.diagnosisCode,
      onsetDate: data.onsetDate
    });
  }

  for (let i = 1; i <= 5; i++) {
    const code = data[`diagnosis${i}Code`] || data[`icdCode${i}`];
    const name = data[`diagnosis${i}Name`] || data[`diagnosisName${i}`];

    if (code || name) {
      diagnoses.push({
        icdCode: code,
        diagnosisName: name || code
      });
    }
  }

  return diagnoses;
}

function extractProcedures(data) {
  const procedures = [];

  if (data.procedureCode || data.procedureName) {
    procedures.push({
      procedureCode: data.procedureCode,
      procedureName: data.procedureName,
      performedDate: data.performedDate
    });
  }

  for (let i = 1; i <= 5; i++) {
    const code = data[`procedure${i}Code`];
    const name = data[`procedure${i}Name`];

    if (code || name) {
      procedures.push({
        procedureCode: code,
        procedureName: name || code
      });
    }
  }

  return procedures;
}

function extractBillingItems(data) {
  const items = [];

  if (data.items && Array.isArray(data.items)) {
    return data.items;
  }

  for (let i = 1; i <= 10; i++) {
    const name =
      data[`item${i}Name`] ||
      data[`item${i}_name`] ||
      data[`service${i}Name`] ||
      data[`service${i}_name`];

    const amount = toNumber(
      data[`item${i}Amount`] ||
      data[`item${i}_amount`] ||
      data[`service${i}Amount`] ||
      data[`service${i}_amount`]
    );

    const qty = toNumber(
      data[`item${i}Quantity`] ||
      data[`item${i}_quantity`] ||
      1
    ) || 1;

    const rate = toNumber(
      data[`item${i}Rate`] ||
      data[`item${i}UnitPrice`] ||
      data[`item${i}_rate`] ||
      data[`item${i}_unitPrice`]
    );

    const code = data[`item${i}Code`] || data[`item${i}_code`];

    if (name && amount >= 0) {
      items.push({
        description: name,
        serviceCode: code,
        quantity: qty,
        unitPrice: rate || amount / qty,
        netAmount: amount
      });
    }
  }

  if (items.length === 0 && (data.serviceName || data.serviceDescription || data.procedureName || data.claimedAmount)) {
    const amount = toNumber(data.serviceAmount || data.claimedAmount || data.totalAmount || 0);

    items.push({
      description: data.serviceName || data.serviceDescription || data.procedureName || 'Medical Service',
      quantity: 1,
      netAmount: amount,
      unitPrice: amount
    });
  }

  return items;
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') return 0;

  const num = Number(
    String(value)
      .replace(/,/g, '')
      .replace(/[^\d.-]/g, '')
  );

  if (!Number.isFinite(num)) return 0;

  return Math.max(0, num);
}

module.exports = {
  convertToFHIR,
  buildUseCaseBundle,
  applyMapping,
  extractDiagnoses,
  extractProcedures,
  extractBillingItems,
  sanitizeRecord
};