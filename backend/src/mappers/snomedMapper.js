/**
 * SNOMED CT Code Mapper
 * Maps common clinical terms, ICD codes, procedures, medications, and body sites to SNOMED CT
 */

const SNOMED_MAPPINGS = {
  icd10: {
    I10: { code: '38341003', display: 'Hypertensive disorder', system: 'http://snomed.info/sct' },
    E11: { code: '44054006', display: 'Diabetes mellitus type 2', system: 'http://snomed.info/sct' },
    E10: { code: '46635009', display: 'Diabetes mellitus type 1', system: 'http://snomed.info/sct' },
    J18: { code: '233604007', display: 'Pneumonia', system: 'http://snomed.info/sct' },
    A90: { code: '38362002', display: 'Dengue', system: 'http://snomed.info/sct' },
    A09: { code: '25374005', display: 'Gastroenteritis', system: 'http://snomed.info/sct' },
    K37: { code: '74400008', display: 'Appendicitis', system: 'http://snomed.info/sct' },
    N20: { code: '95570007', display: 'Kidney stone', system: 'http://snomed.info/sct' },
    H25: { code: '193570009', display: 'Cataract', system: 'http://snomed.info/sct' },
    S82: { code: '414292006', display: 'Fracture of lower leg', system: 'http://snomed.info/sct' },
    Z37: { code: '169762003', display: 'Outcome of delivery', system: 'http://snomed.info/sct' },
    J06: { code: '54150009', display: 'Upper respiratory infection', system: 'http://snomed.info/sct' },
    K21: { code: '235595009', display: 'Gastroesophageal reflux disease', system: 'http://snomed.info/sct' },
    M79: { code: '57676002', display: 'Joint pain', system: 'http://snomed.info/sct' },
    N18: { code: '709044004', display: 'Chronic kidney disease', system: 'http://snomed.info/sct' },
    I25: { code: '53741008', display: 'Coronary arteriosclerosis', system: 'http://snomed.info/sct' },
    C34: { code: '254637007', display: 'Non-small cell carcinoma of lung', system: 'http://snomed.info/sct' },
    Z00: { code: '185349003', display: 'Encounter for examination', system: 'http://snomed.info/sct' },
    Z12: { code: '171149006', display: 'Screening for malignant neoplasm', system: 'http://snomed.info/sct' }
  },

  procedures: {
    APPENDECTOMY: { code: '80146002', display: 'Appendectomy', system: 'http://snomed.info/sct' },
    ANGIOPLASTY: { code: '415070008', display: 'Percutaneous transluminal coronary angioplasty', system: 'http://snomed.info/sct' },
    CATARACT_SURGERY: { code: '54885007', display: 'Cataract extraction', system: 'http://snomed.info/sct' },
    CATARACT: { code: '54885007', display: 'Cataract extraction', system: 'http://snomed.info/sct' },
    URETEROSCOPY: { code: '112790001', display: 'Ureteroscopy', system: 'http://snomed.info/sct' },
    DIALYSIS: { code: '108241001', display: 'Dialysis procedure', system: 'http://snomed.info/sct' },
    HEMODIALYSIS: { code: '302497006', display: 'Hemodialysis', system: 'http://snomed.info/sct' },
    NORMAL_VAGINAL_DELIVERY: { code: '386216000', display: 'Normal delivery procedure', system: 'http://snomed.info/sct' },
    DELIVERY: { code: '386216000', display: 'Normal delivery procedure', system: 'http://snomed.info/sct' },
    IV_ANTIBIOTIC_THERAPY: { code: '281789004', display: 'Antibiotic therapy', system: 'http://snomed.info/sct' },
    ANTIBIOTIC_THERAPY: { code: '281789004', display: 'Antibiotic therapy', system: 'http://snomed.info/sct' },
    IV_FLUID_THERAPY: { code: '182777000', display: 'Intravenous fluid therapy', system: 'http://snomed.info/sct' },
    FLUID_THERAPY: { code: '182777000', display: 'Intravenous fluid therapy', system: 'http://snomed.info/sct' },
    DIABETES_MANAGEMENT: { code: '385804009', display: 'Diabetes management', system: 'http://snomed.info/sct' },
    OPEN_REDUCTION_INTERNAL_FIXATION: { code: '86477000', display: 'Open reduction internal fixation', system: 'http://snomed.info/sct' },
    ORIF: { code: '86477000', display: 'Open reduction internal fixation', system: 'http://snomed.info/sct' },
    PLATELET_MONITORING: { code: '252275004', display: 'Platelet count measurement', system: 'http://snomed.info/sct' },
    ECG: { code: '29303009', display: 'Electrocardiogram', system: 'http://snomed.info/sct' },
    ECHO: { code: '40701008', display: 'Echocardiography', system: 'http://snomed.info/sct' },
    XRAY: { code: '363680008', display: 'Radiographic imaging', system: 'http://snomed.info/sct' },
    X_RAY: { code: '363680008', display: 'Radiographic imaging', system: 'http://snomed.info/sct' },
    CT_SCAN: { code: '77477000', display: 'Computerized axial tomography', system: 'http://snomed.info/sct' },
    MRI: { code: '113091000', display: 'Magnetic resonance imaging', system: 'http://snomed.info/sct' },
    USG: { code: '16310003', display: 'Diagnostic ultrasonography', system: 'http://snomed.info/sct' },
    BLOOD_TEST: { code: '396550006', display: 'Blood test', system: 'http://snomed.info/sct' },
    URINE_TEST: { code: '27171005', display: 'Urinalysis', system: 'http://snomed.info/sct' },
    BIOPSY: { code: '86273004', display: 'Biopsy', system: 'http://snomed.info/sct' },
    SURGERY: { code: '387713003', display: 'Surgical procedure', system: 'http://snomed.info/sct' },
    CHEMOTHERAPY: { code: '367336001', display: 'Chemotherapy', system: 'http://snomed.info/sct' }
  },

  medications: {
    METFORMIN: { code: '372567009', display: 'Metformin', system: 'http://snomed.info/sct' },
    AMLODIPINE: { code: '386864001', display: 'Amlodipine', system: 'http://snomed.info/sct' },
    ATORVASTATIN: { code: '373444002', display: 'Atorvastatin', system: 'http://snomed.info/sct' },
    ASPIRIN: { code: '387458008', display: 'Aspirin', system: 'http://snomed.info/sct' },
    PARACETAMOL: { code: '387517004', display: 'Paracetamol', system: 'http://snomed.info/sct' },
    INSULIN: { code: '67866001', display: 'Insulin', system: 'http://snomed.info/sct' }
  },

  bodySites: {
    CHEST: { code: '51185008', display: 'Thoracic structure', system: 'http://snomed.info/sct' },
    ABDOMEN: { code: '113345001', display: 'Abdominal structure', system: 'http://snomed.info/sct' },
    HEAD: { code: '69536005', display: 'Head structure', system: 'http://snomed.info/sct' },
    KNEE: { code: '57774000', display: 'Knee region structure', system: 'http://snomed.info/sct' },
    HEART: { code: '80891009', display: 'Heart structure', system: 'http://snomed.info/sct' },
    LUNG: { code: '39607008', display: 'Lung structure', system: 'http://snomed.info/sct' },
    LIVER: { code: '10200004', display: 'Liver structure', system: 'http://snomed.info/sct' },
    KIDNEY: { code: '64033007', display: 'Kidney structure', system: 'http://snomed.info/sct' }
  }
};

const PROCEDURE_PRIORITY = [
  'OPEN_REDUCTION_INTERNAL_FIXATION',
  'NORMAL_VAGINAL_DELIVERY',
  'IV_ANTIBIOTIC_THERAPY',
  'ANTIBIOTIC_THERAPY',
  'IV_FLUID_THERAPY',
  'FLUID_THERAPY',
  'DIABETES_MANAGEMENT',
  'CATARACT_SURGERY',
  'APPENDECTOMY',
  'ANGIOPLASTY',
  'HEMODIALYSIS',
  'URETEROSCOPY',
  'PLATELET_MONITORING',
  'DIALYSIS',
  'CATARACT',
  'CT_SCAN',
  'X_RAY',
  'XRAY',
  'ECG',
  'ECHO',
  'MRI',
  'USG',
  'BLOOD_TEST',
  'URINE_TEST',
  'BIOPSY',
  'CHEMOTHERAPY',
  'SURGERY'
];

function normalizeText(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function containsToken(normalizedText, key) {
  const text = `_${normalizedText}_`;
  const token = `_${key}_`;
  return text.includes(token);
}

function mapICD10ToSnomed(icdCode) {
  if (!icdCode) return null;
  const normalized = String(icdCode).toUpperCase().replace('.', '').substring(0, 3);
  return SNOMED_MAPPINGS.icd10[normalized] || null;
}

function mapProcedureToSnomed(procedureName) {
  if (!procedureName) return null;

  const normalized = normalizeText(procedureName);

  for (const key of PROCEDURE_PRIORITY) {
    if (containsToken(normalized, key)) {
      return SNOMED_MAPPINGS.procedures[key];
    }
  }

  return null;
}

function mapMedicationToSnomed(medicationName) {
  if (!medicationName) return null;

  const normalized = normalizeText(medicationName);

  for (const [key, value] of Object.entries(SNOMED_MAPPINGS.medications)) {
    if (containsToken(normalized, key)) return value;
  }

  return null;
}

function mapBodySiteToSnomed(siteName) {
  if (!siteName) return null;

  const normalized = normalizeText(siteName);

  for (const [key, value] of Object.entries(SNOMED_MAPPINGS.bodySites)) {
    if (containsToken(normalized, key)) return value;
  }

  return null;
}

function buildCodeableConcept(originalCode, originalSystem, displayText, snomedLookupType = null) {
  const coding = [];

  if (originalCode) {
    coding.push({
      system: originalSystem || 'http://terminology.hl7.org/CodeSystem/v3-NullFlavor',
      code: originalCode,
      display: displayText
    });
  }

  let snomedCoding = null;

  if (snomedLookupType === 'icd10') {
    snomedCoding = mapICD10ToSnomed(originalCode);
  } else if (snomedLookupType === 'procedure') {
    snomedCoding = mapProcedureToSnomed(displayText || originalCode);
  } else if (snomedLookupType === 'medication') {
    snomedCoding = mapMedicationToSnomed(displayText || originalCode);
  }

  if (snomedCoding) coding.push(snomedCoding);

  return { coding, text: displayText || originalCode };
}

module.exports = {
  mapICD10ToSnomed,
  mapProcedureToSnomed,
  mapMedicationToSnomed,
  mapBodySiteToSnomed,
  buildCodeableConcept,
  SNOMED_MAPPINGS
};