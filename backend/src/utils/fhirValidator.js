/**
 * NHCX FHIR Bundle Validator
 * Rule-based validation for generated FHIR R4 bundles.
 */

const SNOMED_SYSTEM = 'http://snomed.info/sct';
const NHCX_BASE = 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/';

const ALLOWED_BUNDLE_TYPES = ['collection', 'transaction'];

const MANDATORY_FIELDS = {
  Patient: [
    r => r.id,
    r => r.name && r.name.length > 0,
    r => r.gender,
    r => r.meta && r.meta.profile
  ],

  Claim: [
    r => r.id,
    r => r.status,
    r => r.type && r.type.coding,
    r => r.use,
    r => r.patient,
    r => r.created,
    r => r.insurer,
    r => r.provider,
    r => r.insurance && r.insurance.length > 0,
    r => r.total,
    r => r.item && r.item.length > 0
  ],

  Coverage: [
    r => r.id,
    r => r.status,
    r => r.type,
    r => r.beneficiary,
    r => r.payor && r.payor.length > 0
  ],

  Encounter: [
    r => r.id,
    r => r.status,
    r => r.class,
    r => r.subject
  ],

  Organization: [
    r => r.id,
    r => r.name,
    r => r.type && r.type.length > 0
  ],

  Condition: [
    r => r.id,
    r => r.code,
    r => r.subject
  ],

  Procedure: [
    r => r.id,
    r => r.status,
    r => r.code,
    r => r.subject
  ]
};

function validateBundle(bundle) {
  const result = {
    valid: true,
    profileCheck: 'PASS',
    mandatoryFields: 'PASS',
    referenceIntegrity: 'PASS',
    terminologyCheck: 'PASS',
    businessRules: 'PASS',
    details: {
      profileErrors: [],
      mandatoryErrors: [],
      referenceErrors: [],
      terminologyErrors: [],
      businessErrors: [],
      warnings: []
    },
    summary: ''
  };

  if (!bundle || bundle.resourceType !== 'Bundle') {
    return fail(result, 'Input is not a valid FHIR Bundle');
  }

  checkProfiles(bundle, result);
  checkMandatoryFields(bundle, result);
  checkReferenceIntegrity(bundle, result);
  checkTerminology(bundle, result);
  checkBusinessRules(bundle, result);

  result.valid =
    result.profileCheck === 'PASS' &&
    result.mandatoryFields === 'PASS' &&
    result.referenceIntegrity === 'PASS' &&
    result.terminologyCheck === 'PASS' &&
    result.businessRules === 'PASS';

  result.summary = buildSummary(result);
  return result;
}

function checkProfiles(bundle, result) {
  const errors = [];

  if (!ALLOWED_BUNDLE_TYPES.includes(bundle.type)) {
    errors.push(`Bundle.type must be one of ${ALLOWED_BUNDLE_TYPES.join(', ')}, found "${bundle.type}"`);
  }

  const bundleProfile = bundle.meta?.profile?.[0] || '';

  if (!bundleProfile.includes(NHCX_BASE)) {
    errors.push(`Bundle.meta.profile should reference NHCX profile (${NHCX_BASE}Bundle)`);
  }

  (bundle.entry || []).forEach((entry, idx) => {
    const type = entry.resource?.resourceType || 'Unknown';

    if (!entry.fullUrl) {
      errors.push(`entry[${idx}] (${type}) missing fullUrl`);
    } else if (!entry.fullUrl.startsWith('urn:uuid:')) {
      errors.push(`entry[${idx}] fullUrl should use urn:uuid scheme, found "${entry.fullUrl}"`);
    }

    if (bundle.type === 'transaction') {
      if (!entry.request?.method) {
        errors.push(`entry[${idx}] (${type}) missing request.method`);
      }

      if (!entry.request?.url) {
        errors.push(`entry[${idx}] (${type}) missing request.url`);
      }
    }

    const rProfiles = entry.resource?.meta?.profile || [];

    if (rProfiles.length === 0) {
      errors.push(`${type}/${entry.resource?.id || 'no-id'} missing meta.profile`);
    }
  });

  if (errors.length > 0) {
    result.profileCheck = 'FAIL';
    result.details.profileErrors = errors;
  }
}

function checkMandatoryFields(bundle, result) {
  const errors = [];

  (bundle.entry || []).forEach(entry => {
    const r = entry.resource;
    if (!r) return;

    const rules = MANDATORY_FIELDS[r.resourceType];
    if (!rules) return;

    rules.forEach((rule, idx) => {
      try {
        if (!rule(r)) {
          errors.push(`${r.resourceType}/${r.id}: mandatory field check #${idx + 1} failed`);
        }
      } catch (e) {
        errors.push(`${r.resourceType}/${r.id}: rule #${idx + 1} threw error - ${e.message}`);
      }
    });
  });

  if (errors.length > 0) {
    result.mandatoryFields = 'FAIL';
    result.details.mandatoryErrors = errors;
  }
}

function checkReferenceIntegrity(bundle, result) {
  const errors = [];

  const resolvable = new Set();

  (bundle.entry || []).forEach(entry => {
    if (entry.fullUrl) resolvable.add(entry.fullUrl);

    if (entry.resource?.resourceType && entry.resource?.id) {
      resolvable.add(`${entry.resource.resourceType}/${entry.resource.id}`);
      resolvable.add(`urn:uuid:${entry.resource.id}`);
    }
  });

  (bundle.entry || []).forEach(entry => {
    const r = entry.resource;
    if (!r) return;

    const refs = extractAllReferences(r);

    refs.forEach(ref => {
      if (!resolvable.has(ref)) {
        errors.push(`${r.resourceType}/${r.id}: unresolvable reference "${ref}"`);
      }
    });
  });

  if (errors.length > 0) {
    result.referenceIntegrity = 'FAIL';
    result.details.referenceErrors = errors;
  }
}

function extractAllReferences(obj, refs = []) {
  if (!obj || typeof obj !== 'object') return refs;

  if (Array.isArray(obj)) {
    obj.forEach(item => extractAllReferences(item, refs));
  } else {
    if (typeof obj.reference === 'string') refs.push(obj.reference);
    Object.values(obj).forEach(v => extractAllReferences(v, refs));
  }

  return refs;
}

function checkTerminology(bundle, result) {
  const errors = [];

  (bundle.entry || []).forEach(entry => {
    const r = entry.resource;
    if (!r) return;

    if (r.resourceType === 'Condition') {
      const hasSNOMED = (r.code?.coding || []).some(c => c.system === SNOMED_SYSTEM && c.code);

      if (!hasSNOMED) {
        errors.push(`Condition/${r.id}: should have SNOMED CT coding`);
      }
    }

    if (r.resourceType === 'Procedure') {
      const hasAnyCoding = (r.code?.coding || []).some(c => c.code);

      if (!hasAnyCoding) {
        result.details.warnings.push(`Procedure/${r.id}: procedure coding is missing`);
      }
    }

    if (r.resourceType === 'Claim' && r.item) {
      r.item.forEach((item, idx) => {
        const hasCoding = (item.productOrService?.coding || []).some(c => c.code);

        if (!hasCoding) {
          errors.push(`Claim/${r.id} item[${idx + 1}]: productOrService coding missing`);
        }
      });
    }

    if (r.resourceType === 'Encounter') {
      const hasSNOMED = (r.type || []).some(t =>
        (t.coding || []).some(c => c.system === SNOMED_SYSTEM)
      );

      if (!hasSNOMED) {
        result.details.warnings.push(`Encounter/${r.id}: type coding should include SNOMED CT`);
      }
    }
  });

  if (errors.length > 0) {
    result.terminologyCheck = 'FAIL';
    result.details.terminologyErrors = errors;
  }
}

function checkBusinessRules(bundle, result) {
  const errors = [];
  const warnings = result.details.warnings;

  (bundle.entry || []).forEach(entry => {
    const r = entry.resource;

    if (r?.resourceType === 'Claim') {
      if (r.total && Number(r.total.value) < 0) {
        errors.push(`Claim/${r.id}: total amount cannot be negative`);
      }

      if (r.item && r.item.length > 0 && r.total) {
        const itemsSum = r.item.reduce((sum, item) => sum + Number(item.net?.value || 0), 0);
        const rounded = Math.round(itemsSum * 100) / 100;
        const total = Math.round(Number(r.total.value || 0) * 100) / 100;

        if (total > 0 && rounded > 0 && Math.abs(rounded - total) > 0.01) {
          warnings.push(
            `Claim/${r.id}: Claim.total (${total} INR) does not equal sum of item.net (${rounded} INR)`
          );
        }
      }

      if (!r.encounter || r.encounter.length === 0) {
        warnings.push(`Claim/${r.id}: no encounter reference found`);
      }

      if (!r.diagnosis || r.diagnosis.length === 0) {
        warnings.push(`Claim/${r.id}: no diagnosis reference found`);
      }

      if (!r.procedure || r.procedure.length === 0) {
        warnings.push(`Claim/${r.id}: no procedure reference found`);
      }
    }

    if (r?.resourceType === 'Coverage') {
      if (!r.subscriberId) {
        warnings.push(`Coverage/${r.id}: subscriberId is missing`);
      }
    }

    if (r?.resourceType === 'Encounter') {
      if (r.period?.start && r.period?.end && r.period.end < r.period.start) {
        errors.push(`Encounter/${r.id}: period.end is before period.start`);
      }
    }
  });

  if (errors.length > 0) {
    result.businessRules = 'FAIL';
    result.details.businessErrors = errors;
  }
}

function fail(result, msg) {
  result.valid = false;
  result.profileCheck = 'FAIL';
  result.details.profileErrors.push(msg);
  result.summary = msg;
  return result;
}

function buildSummary(result) {
  const checks = [
    `Profile: ${result.profileCheck}`,
    `Mandatory Fields: ${result.mandatoryFields}`,
    `Reference Integrity: ${result.referenceIntegrity}`,
    `Terminology: ${result.terminologyCheck}`,
    `Business Rules: ${result.businessRules}`
  ];

  const warnings = result.details.warnings.length;

  return checks.join(' | ') + (warnings > 0 ? ` | Warnings: ${warnings}` : '');
}

module.exports = { validateBundle };