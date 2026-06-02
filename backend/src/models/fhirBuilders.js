const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { mapICD10ToSnomed, mapProcedureToSnomed } = require('../mappers/snomedMapper');

const NHCX_PROFILES = {
  Bundle: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Bundle',
  CoverageEligibilityRequest: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/CoverageEligibilityRequest',
  CoverageEligibilityResponse: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/CoverageEligibilityResponse',
  Claim: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Claim',
  ClaimResponse: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/ClaimResponse',
  Communication: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Communication',
  Patient: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient',
  Coverage: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Coverage',
  Organization: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Organization',
  Practitioner: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Practitioner',
  Condition: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition',
  Procedure: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Procedure',
  Encounter: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Encounter'
};

const SYSTEMS = {
  ABHA: 'https://healthid.ndhm.gov.in',
  PMJAY: 'https://pmjay.gov.in',
  NIN: 'http://nrces.in/ndhm/fhir/r4/CodeSystem/ndhm-identifier-type-code',
  ICD10: 'http://hl7.org/fhir/sid/icd-10',
  SNOMED: 'http://snomed.info/sct',
  NHCX_CLAIM_TYPE: 'http://nrces.in/ndhm/fhir/r4/CodeSystem/nhcx-claim-type',
  NHCX_CLAIM_SUB_TYPE: 'http://nrces.in/ndhm/fhir/r4/CodeSystem/nhcx-claim-sub-type'
};

const SNOMED_BILLING_ITEMS = {
  consultation: { code: '11429006', display: 'Consultation' },
  bedCharges: { code: '229070002', display: 'Inpatient bed accommodation' },
  pharmacy: { code: '182836005', display: 'Administration of medicine' },
  nursing: { code: '224557004', display: 'Nursing care' },
  labTest: { code: '15220000', display: 'Laboratory test' },
  xray: { code: '363680008', display: 'Radiographic imaging procedure' },
  surgery: { code: '387713003', display: 'Surgical procedure' },
  icu: { code: '309904001', display: 'Intensive care unit service' },
  anaesthesia: { code: '399097000', display: 'Administration of anaesthesia' },
  dialysis: { code: '108241001', display: 'Dialysis procedure' }
};

function makeId() {
  return uuidv4();
}

function makeFullUrl(resourceType, id) {
  return `urn:uuid:${id}`;
}

function makeReference(resourceType, id, display = null) {
  const ref = { reference: `${resourceType}/${id}` };
  if (display) ref.display = display;
  return ref;
}

function makeUrnReference(id, display = null) {
  const ref = { reference: `urn:uuid:${id}` };
  if (display) ref.display = display;
  return ref;
}

function cleanString(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function safeAmount(value) {
  if (value === undefined || value === null || value === '') return 0;
  const num = Number(String(value).replace(/,/g, '').replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, num);
}

function isISODate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
}

function isBadId(value) {
  const v = cleanString(value).toLowerCase();
  return ['ip', 'op', 'i', 'o', 'inpatient', 'outpatient', 'in-patient', 'out-patient'].includes(v);
}

function formatDate(dateStr) {
  if (!dateStr) return undefined;

  const formats = [
    'YYYY-MM-DD',
    'DD/MM/YYYY',
    'MM/DD/YYYY',
    'DD-MM-YYYY',
    'YYYYMMDD',
    'DD MMM YYYY'
  ];

  const m = moment(dateStr, formats, true);
  return m.isValid() ? m.format('YYYY-MM-DD') : undefined;
}

function formatDateTime(dateStr) {
  if (!dateStr) return moment().toISOString();

  const formats = [
    moment.ISO_8601,
    'YYYY-MM-DD',
    'DD/MM/YYYY',
    'MM/DD/YYYY',
    'DD-MM-YYYY',
    'YYYYMMDD',
    'DD MMM YYYY'
  ];

  const m = moment(dateStr, formats, true);
  return m.isValid() ? m.toISOString() : moment().toISOString();
}

function normalizeDateRange(startDate, endDate) {
  const start = formatDate(startDate);
  let end = formatDate(endDate);

  if (start && end && moment(end).isBefore(moment(start))) {
    end = start;
  }

  return { start, end };
}

function isBadPatientName(name, data = {}) {
  if (!name) return true;

  const n = cleanString(name).toLowerCase();

  const badValues = [
    data.hospitalName,
    data.providerName,
    data.hospitalId,
    data.providerId,
    data.procedureName,
    data.serviceName,
    data.item1Name,
    data.item2Name,
    data.item3Name,
    data.hospitalizationType,
    'hemodialysis',
    'pharmacy & medications',
    'rainbow hospital',
    'ip',
    'op',
    'inpatient',
    'outpatient',
    'hospital',
    'insurance company',
    'medical service',
    'claim',
    'procedure',
    'treatment'
  ].filter(Boolean).map(v => cleanString(v).toLowerCase());

  return badValues.includes(n);
}

function buildPatient(data) {
  const id = data.patientId || data.mrNumber || data.memberId || makeId();
  const identifiers = [];

  if (data.abhaId) {
    identifiers.push({
      type: {
        coding: [{
          system: SYSTEMS.NIN,
          code: 'ABHA',
          display: 'Ayushman Bharat Health Account'
        }]
      },
      system: SYSTEMS.ABHA,
      value: data.abhaId
    });
  }

  if (data.patientId && !data.abhaId) {
    identifiers.push({
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
          code: 'MR',
          display: 'Medical Record Number'
        }]
      },
      value: data.patientId
    });
  }

  let patientName =
    data.patientName ||
    data.memberName ||
    data.insuredName ||
    data.subscriberName ||
    data.name ||
    '';

  if (isBadPatientName(patientName, data)) {
    patientName =
      data.memberName ||
      data.insuredName ||
      data.subscriberName ||
      data.patientId ||
      'Unknown Patient';
  }

  const parts = cleanString(patientName).split(/\s+/).filter(Boolean);

  const patient = {
    resourceType: 'Patient',
    id,
    meta: { profile: [NHCX_PROFILES.Patient] },
    identifier: identifiers,
    name: [{
      use: 'official',
      text: patientName,
      family: data.lastName || parts.slice(-1)[0] || '',
      given: [data.firstName || parts.slice(0, -1).join(' ') || parts[0] || '']
    }],
    gender: mapGender(data.gender),
    telecom: [],
    address: []
  };

  const dob = formatDate(data.dob);
  if (dob) patient.birthDate = dob;

  if (data.phone || data.mobile) {
    patient.telecom.push({
      system: 'phone',
      value: data.phone || data.mobile,
      use: 'mobile'
    });
  }

  if (data.email) {
    patient.telecom.push({ system: 'email', value: data.email });
  }

  if (data.address) {
    patient.address.push({
      use: 'home',
      text: data.address,
      city: data.city,
      state: data.state,
      postalCode: data.pincode
    });
  }

  return { resource: patient, id, fullUrl: makeFullUrl('Patient', id) };
}

function buildOrganization(data, type = 'hospital') {
  let id = data.orgId || data.hospitalId || data.insurerId || makeId();
  if (isBadId(id) || isISODate(id)) id = makeId();

  let orgName =
    data.orgName ||
    data.hospitalName ||
    data.insurerName ||
    data.providerName ||
    'Unknown Organization';

  if (type !== 'insurer') {
    if (isBadId(orgName) || cleanString(orgName).toLowerCase() === 'unknown organization') {
      orgName = data.hospitalName || data.providerName || data.facilityName || 'Hospital';
    }
  }

  if (type === 'insurer') {
    if (!orgName || orgName === 'Unknown Organization' || orgName === data.insurerId || isISODate(orgName)) {
      orgName = data.insuranceCompany || data.payerName || data.tpaName || 'Insurance Company';
    }
  }

  const org = {
    resourceType: 'Organization',
    id,
    meta: { profile: [NHCX_PROFILES.Organization] },
    identifier: [],
    name: orgName,
    type: [{
      coding: type === 'insurer'
        ? [{
            system: 'http://terminology.hl7.org/CodeSystem/organization-type',
            code: 'ins',
            display: 'Insurance Company'
          }]
        : [{
            system: 'http://terminology.hl7.org/CodeSystem/organization-type',
            code: 'prov',
            display: 'Healthcare Provider'
          }]
    }]
  };

  if (data.rohiniId) {
    org.identifier.push({ system: 'https://rohini.gov.in', value: data.rohiniId });
  }

  if (data.insurerId && type === 'insurer') {
    org.identifier.push({ system: 'https://irdai.gov.in', value: data.insurerId });
  }

  if (data.gstin) {
    org.identifier.push({ system: 'https://gstin.gov.in', value: data.gstin });
  }

  return { resource: org, id, fullUrl: makeFullUrl('Organization', id) };
}

function buildCoverage(data, patientRef, insurerRef) {
  let id = data.coverageId || data.policyNumber || data.memberId || data.subscriberId || makeId();

  if (isISODate(id) || isBadId(id)) {
    id = data.policyNumber || data.memberId || data.subscriberId || makeId();
  }

  const coverage = {
    resourceType: 'Coverage',
    id,
    meta: { profile: [NHCX_PROFILES.Coverage] },
    identifier: [{ system: 'https://nhcx.gov.in/coverage', value: id }],
    status: 'active',
    type: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: data.policyType === 'GOVERNMENT' ? 'PUBLICPOL' : 'HIP',
        display: data.policyType === 'GOVERNMENT' ? 'public healthcare' : 'health insurance plan policy'
      }]
    },
    subscriberId: data.subscriberId || data.memberId || data.policyNumber || id,
    beneficiary: patientRef,
    relationship: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/subscriber-relationship',
        code: mapRelationship(data.relationship),
        display: data.relationship || 'Self'
      }]
    },
    payor: [insurerRef]
  };

  const start = formatDate(data.policyStartDate);
  const end = formatDate(data.policyEndDate);

  if (start || end) {
    coverage.period = {};
    if (start) coverage.period.start = start;
    if (end) coverage.period.end = end;
  }

  const insuredAmount = safeAmount(data.sumInsured || data.coverageAmount);

  if (data.groupNumber) {
    coverage.class = [{
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/coverage-class',
          code: 'group'
        }]
      },
      value: data.groupNumber
    }];
  }

  if (insuredAmount > 0) {
    coverage.costToBeneficiary = [{
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/coverage-copay-type',
          code: 'maxout'
        }]
      },
      valueMoney: { value: insuredAmount, currency: 'INR' }
    }];
  }

  return { resource: coverage, id, fullUrl: makeFullUrl('Coverage', id) };
}

function buildCondition(diagData, patientRef) {
  const id = makeId();
  const icdCode = diagData.icdCode || diagData.diagnosisCode;
  const diagName = diagData.diagnosisName || diagData.description || icdCode || 'Unknown Condition';

  const snomedMapping = icdCode ? mapICD10ToSnomed(icdCode) : null;
  const coding = [];

  if (snomedMapping) {
    coding.push({
      system: SYSTEMS.SNOMED,
      code: snomedMapping.code,
      display: snomedMapping.display
    });
  } else {
    coding.push({
      system: SYSTEMS.SNOMED,
      code: '404684003',
      display: diagName
    });
  }

  if (icdCode) {
    coding.push({
      system: SYSTEMS.ICD10,
      code: icdCode,
      display: diagName
    });
  }

  const condition = {
    resourceType: 'Condition',
    id,
    meta: { profile: [NHCX_PROFILES.Condition] },
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'active'
      }]
    },
    verificationStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: 'confirmed'
      }]
    },
    code: { coding, text: diagName },
    subject: patientRef
  };

  const onset = formatDate(diagData.onsetDate || diagData.admissionDate);
  if (onset) condition.onsetDateTime = onset;

  return { resource: condition, id, fullUrl: makeFullUrl('Condition', id) };
}

function buildProcedure(procData, patientRef) {
  const id = makeId();
  const procedureText =
    procData.procedureName ||
    procData.description ||
    procData.procedureCode ||
    'Medical Procedure';

  const snomedMapping = mapProcedureToSnomed(procedureText);
  const coding = [];

  if (snomedMapping) {
    coding.push({
      system: SYSTEMS.SNOMED,
      code: snomedMapping.code,
      display: snomedMapping.display
    });
  }

  if (procData.procedureCode) {
    coding.push({
      system: 'http://www.cms.gov/Medicare/Coding/ICD10',
      code: procData.procedureCode,
      display: procedureText
    });
  }

  const procedure = {
    resourceType: 'Procedure',
    id,
    meta: { profile: [NHCX_PROFILES.Procedure] },
    status: 'completed',
    code: { coding, text: procedureText },
    subject: patientRef
  };

  const performed = formatDate(procData.performedDate || procData.admissionDate);
  if (performed) procedure.performedDateTime = performed;

  return { resource: procedure, id, fullUrl: makeFullUrl('Procedure', id) };
}

function buildEncounter(data, patientRef, providerRef) {
  const id = data.encounterId || makeId();

  const admissionType = cleanString(data.admissionType || data.hospitalizationType || 'inpatient').toLowerCase();

  const encounterClass =
    admissionType.includes('out') || admissionType.includes('opd')
      ? { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' }
      : { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'IMP', display: 'inpatient encounter' };

  const range = normalizeDateRange(data.admissionDate || data.serviceStartDate, data.dischargeDate || data.serviceEndDate);

  const period = {};
  if (range.start) period.start = range.start;
  if (range.end) period.end = range.end;

  const encounter = {
    resourceType: 'Encounter',
    id,
    meta: { profile: [NHCX_PROFILES.Encounter] },
    identifier: [{ system: 'https://nhcx.gov.in/encounter', value: data.encounterId || id }],
    status: range.end ? 'finished' : 'in-progress',
    class: encounterClass,
    type: [{
      coding: [{
        system: SYSTEMS.SNOMED,
        code: admissionType.includes('out') || admissionType.includes('opd') ? '11429006' : '32485007',
        display: admissionType.includes('out') || admissionType.includes('opd') ? 'Consultation' : 'Hospital admission'
      }]
    }],
    subject: patientRef,
    period,
    serviceProvider: providerRef
  };

  if (admissionType.includes('in')) {
    encounter.hospitalization = {
      admitSource: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/admit-source',
          code: 'emd',
          display: 'From accident/emergency department'
        }]
      },
      dischargeDisposition: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/discharge-disposition',
          code: 'home',
          display: 'Home'
        }]
      }
    };
  }

  return { resource: encounter, id, fullUrl: makeFullUrl('Encounter', id) };
}

function buildCoverageEligibilityRequest(data, refs) {
  const id = data.requestId || makeId();

  const resource = {
    resourceType: 'CoverageEligibilityRequest',
    id,
    meta: { profile: [NHCX_PROFILES.CoverageEligibilityRequest] },
    identifier: [{ system: 'https://nhcx.gov.in/eligibility-request', value: data.requestId || id }],
    status: 'active',
    purpose: ['benefits', 'validation'],
    patient: refs.patient,
    created: formatDateTime(data.requestDate || new Date()),
    insurer: refs.insurer,
    provider: refs.provider,
    insurance: [{
      focal: true,
      coverage: refs.coverage
    }]
  };

  if (data.serviceType) {
    resource.item = [{
      category: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/ex-benefitcategory',
          code: '1',
          display: data.serviceType
        }]
      }
    }];
  }

  return { resource, id, fullUrl: makeFullUrl('CoverageEligibilityRequest', id) };
}

function buildClaim(data, refs) {
  const id = data.claimId || makeId();
  const isPreAuth = data.claimType === 'preauth' || data.useCase === 'preauth';

  const rawItems = data.items || data.billingItems || [];
  const builtItems = buildClaimItems(rawItems, data);

  const itemsTotal = builtItems.reduce((sum, item) => sum + safeAmount(item.net?.value), 0);
  const fallbackTotal = safeAmount(data.claimedAmount || data.totalAmount || data.serviceAmount);
  const totalAmount = itemsTotal > 0 ? Math.round(itemsTotal * 100) / 100 : fallbackTotal;

  const range = normalizeDateRange(data.admissionDate || data.serviceStartDate, data.dischargeDate || data.serviceEndDate);

  const billablePeriod = {};
  if (range.start) billablePeriod.start = range.start;
  if (range.end) billablePeriod.end = range.end;

  const claim = {
    resourceType: 'Claim',
    id,
    meta: { profile: [NHCX_PROFILES.Claim] },
    identifier: [{ system: 'https://nhcx.gov.in/claim', value: data.claimId || id }],
    status: 'active',
    type: {
      coding: [{
        system: SYSTEMS.NHCX_CLAIM_TYPE,
        code: isPreAuth ? 'preauthorization' : 'institutional',
        display: isPreAuth ? 'Pre-Authorization' : 'Institutional'
      }]
    },
    subType: data.claimSubType
      ? { coding: [{ system: SYSTEMS.NHCX_CLAIM_SUB_TYPE, code: data.claimSubType }] }
      : undefined,
    use: isPreAuth ? 'preauthorization' : 'claim',
    patient: refs.patient,
    billablePeriod,
    created: formatDateTime(data.claimDate || new Date()),
    insurer: refs.insurer,
    provider: refs.provider,
    priority: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/processpriority',
        code: data.priority || 'normal'
      }]
    },
    insurance: [{ sequence: 1, focal: true, coverage: refs.coverage }],
    item: builtItems,
    total: { value: totalAmount, currency: 'INR' }
  };

  if (!data.claimDate) {
    claim.extension = [{
      url: 'https://nhcx.gov.in/extensions/generated-date',
      valueBoolean: true
    }];
  }

  if (refs.encounter) claim.encounter = [refs.encounter];

  if (refs.conditions && refs.conditions.length > 0) {
    claim.diagnosis = refs.conditions.map((condRef, index) => ({
      sequence: index + 1,
      diagnosisReference: condRef,
      type: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/ex-diagnosistype',
          code: index === 0 ? 'principal' : 'admitting'
        }]
      }]
    }));
  }

  if (refs.procedures && refs.procedures.length > 0) {
    claim.procedure = refs.procedures.map((procRef, index) => ({
      sequence: index + 1,
      procedureReference: procRef
    }));
  }

  if (data.hospitalizationType) {
    claim.supportingInfo = [{
      sequence: 1,
      category: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/claiminformationcategory',
          code: 'info'
        }]
      },
      code: {
        coding: [{
          system: 'https://nhcx.gov.in/hospitalization-type',
          code: data.hospitalizationType
        }]
      }
    }];
  }

  return { resource: claim, id, fullUrl: makeFullUrl('Claim', id) };
}

function buildClaimItems(items, data) {
  if (items.length > 0) {
    return items.map((item, index) => {
      const desc = item.description || item.serviceName || item.name || data.procedureName || 'Medical Service';
      const snomedKey = detectItemCategory(desc);
      const snomedInfo = SNOMED_BILLING_ITEMS[snomedKey] || SNOMED_BILLING_ITEMS.consultation;

      const qty = safeAmount(item.quantity || 1) || 1;
      const net = safeAmount(item.netAmount || item.amount || item.unitPrice || item.rate || 0);
      const unitPrice = safeAmount(item.unitPrice || item.rate || net / qty);

      const coding = [{
        system: SYSTEMS.SNOMED,
        code: snomedInfo.code,
        display: snomedInfo.display
      }];

      if (item.serviceCode) {
        coding.push({
          system: 'http://www.cms.gov/Medicare/Coding/ICD10',
          code: item.serviceCode,
          display: desc
        });
      }

      return {
        sequence: index + 1,
        productOrService: { coding, text: desc },
        quantity: { value: qty },
        unitPrice: { value: unitPrice, currency: 'INR' },
        net: { value: net, currency: 'INR' }
      };
    });
  }

  const totalAmt = safeAmount(data.claimedAmount || data.totalAmount || data.serviceAmount);

  return [{
    sequence: 1,
    productOrService: {
      coding: [{
        system: SYSTEMS.SNOMED,
        code: SNOMED_BILLING_ITEMS.consultation.code,
        display: SNOMED_BILLING_ITEMS.consultation.display
      }],
      text: data.procedureName || 'Medical Service'
    },
    quantity: { value: 1 },
    unitPrice: { value: totalAmt, currency: 'INR' },
    net: { value: totalAmt, currency: 'INR' }
  }];
}

function detectItemCategory(name = '') {
  const n = name.toUpperCase();

  if (n.includes('DIALYSIS') || n.includes('HEMODIALYSIS')) return 'dialysis';
  if (n.includes('CONSULT') || n.includes('VISIT') || n.includes('OPD')) return 'consultation';
  if (n.includes('BED') || n.includes('ROOM') || n.includes('WARD')) return 'bedCharges';
  if (n.includes('PHARMA') || n.includes('MEDIC') || n.includes('DRUG')) return 'pharmacy';
  if (n.includes('NURS')) return 'nursing';
  if (n.includes('LAB') || n.includes('TEST') || n.includes('BLOOD') || n.includes('DIAGNOSTIC')) return 'labTest';
  if (n.includes('XRAY') || n.includes('X-RAY') || n.includes('SCAN') || n.includes('MRI') || n.includes('CT')) return 'xray';
  if (n.includes('SURG') || n.includes('OPERAT') || n.includes('THEATRE') || n.includes('OT')) return 'surgery';
  if (n.includes('ICU') || n.includes('INTENSIVE')) return 'icu';
  if (n.includes('ANAES') || n.includes('ANEST')) return 'anaesthesia';

  return 'consultation';
}

function buildCommunication(data, refs) {
  const id = data.communicationId || makeId();

  const communication = {
    resourceType: 'Communication',
    id,
    meta: { profile: [NHCX_PROFILES.Communication] },
    identifier: [{ system: 'https://nhcx.gov.in/communication', value: data.communicationId || id }],
    status: data.status || 'completed',
    category: [{
      coding: [{
        system: 'https://nhcx.gov.in/communication-category',
        code: data.category || 'medical-records',
        display: data.categoryDisplay || 'Medical Records'
      }]
    }],
    subject: refs.patient,
    about: refs.claim ? [refs.claim] : undefined,
    sent: formatDateTime(data.sentDate || new Date()),
    recipient: refs.insurer ? [refs.insurer] : [],
    sender: refs.provider,
    payload: []
  };

  if (data.message || data.notes) {
    communication.payload.push({ contentString: data.message || data.notes });
  }

  if (data.attachments) {
    const attachments = Array.isArray(data.attachments) ? data.attachments : [data.attachments];

    attachments.forEach(att => {
      communication.payload.push({
        contentAttachment: {
          contentType: att.contentType || 'application/pdf',
          url: att.url || undefined,
          title: att.title || att.name || 'Document'
        }
      });
    });
  }

  return { resource: communication, id, fullUrl: makeFullUrl('Communication', id) };
}

function buildBundle(useCase, resources) {
  const bundleId = makeId();

  const safeResources = resources.filter(r => r && r.resource && r.resource.resourceType);

  const entries = safeResources.map(({ resource, fullUrl }) => ({
    fullUrl,
    resource,
    request: {
      method: 'POST',
      url: resource.resourceType
    }
  }));

  return {
    resourceType: 'Bundle',
    id: bundleId,
    meta: {
      versionId: '1',
      lastUpdated: moment().toISOString(),
      profile: [NHCX_PROFILES.Bundle]
    },
    identifier: {
      system: 'https://nhcx.gov.in',
      value: bundleId
    },
    type: 'transaction',
    timestamp: moment().toISOString(),
    entry: entries
  };
}

function mapGender(gender) {
  if (!gender) return 'unknown';

  const g = String(gender).toLowerCase();

  if (g === 'm' || g === 'male') return 'male';
  if (g === 'f' || g === 'female') return 'female';
  if (g === 'o' || g === 'other') return 'other';

  return 'unknown';
}

function mapRelationship(rel) {
  if (!rel) return 'self';

  const r = String(rel).toLowerCase();

  if (r === 'self' || r === 'subscriber') return 'self';
  if (r === 'spouse' || r === 'wife' || r === 'husband') return 'spouse';
  if (r === 'child' || r === 'son' || r === 'daughter') return 'child';
  if (r === 'parent' || r === 'father' || r === 'mother') return 'parent';

  return 'other';
}

module.exports = {
  buildPatient,
  buildOrganization,
  buildCoverage,
  buildCondition,
  buildProcedure,
  buildEncounter,
  buildCoverageEligibilityRequest,
  buildClaim,
  buildCommunication,
  buildBundle,
  makeReference,
  makeUrnReference,
  makeFullUrl,
  formatDate,
  formatDateTime,
  NHCX_PROFILES,
  SYSTEMS
};