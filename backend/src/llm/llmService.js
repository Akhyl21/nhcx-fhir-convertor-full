const logger = require('../utils/logger');

const MASTER_SCHEMA = {
  patient: {
    required: ['patientName', 'gender'],
    fields: {
      patientId: [
        'patient_id', 'patient id', 'mr no', 'mrn', 'uhid', 'pid',
        'patient_number', 'registration_no', 'reg_no', 'ipd_no', 'opd_no',
        'medical_record_no', 'medical record number'
      ],
      patientName: [
        'patient_name', 'name', 'patient name', 'full_name', 'beneficiary_name',
        'member_name', 'insured_name', 'pt name', 'pt_name', 'patient',
        'beneficiary', 'insured person', 'member', 'patient fullname',
        'patient full name', 'insured_member_name', 'subscriber_name'
      ],
      gender: ['sex', 'gender', 'patient_gender', 'sex_code', 'pt_gender'],
      dob: [
        'date_of_birth', 'dob', 'birth_date', 'date of birth',
        'patient_dob', 'birthdate', 'birth_dt'
      ],
      age: ['age', 'patient_age', 'age_years'],
      phone: [
        'phone', 'mobile', 'contact', 'phone_no', 'mobile_no',
        'contact_no', 'phone_number', 'cell', 'mobile no'
      ],
      email: ['email', 'email_id', 'email_address'],
      address: ['address', 'patient_address', 'residential_address', 'home_address', 'addr'],
      city: ['city', 'town', 'patient_city'],
      state: ['state', 'patient_state'],
      pincode: ['pincode', 'pin', 'zip', 'postal_code', 'zip_code', 'pin code'],
      abhaId: ['abha_id', 'abha', 'health_id', 'abha_number', 'abdm_id', 'abha id'],
      aadhar: ['aadhar', 'aadhar_no', 'aadhaar', 'uid_no']
    }
  },

  insurance: {
    fields: {
      policyNumber: [
        'policy_no', 'policy_number', 'policy no', 'policy_id',
        'insurance_policy_no', 'group_policy_no', 'policy number',
        'policy', 'policyid', 'coverage_id', 'coverage number'
      ],
      insurerName: [
        'insurer_name', 'insurance_company', 'tpa_name', 'payer_name',
        'insurance_company_name', 'ins_company', 'insurance company',
        'insurer', 'payer', 'tpa', 'company_name'
      ],
      insurerId: [
        'insurer_id', 'insurance_company_id', 'tpa_id', 'payer_id',
        'irdai_id', 'insurance_id'
      ],
      memberId: [
        'member_id', 'member no', 'card_no', 'beneficiary_id',
        'employee_id', 'e_card_no', 'member id', 'subscriber_id',
        'subscriber id'
      ],
      sumInsured: [
        'sum_insured', 'sum insured', 'coverage_amount', 'insured_amount',
        'policy_amount', 'si', 'sum_assured', 'coverage', 'limit',
        'insurance_limit'
      ],
      policyStartDate: [
        'policy_start_date', 'start_date', 'valid_from', 'inception_date',
        'policy_from', 'policy start date'
      ],
      policyEndDate: [
        'policy_end_date', 'end_date', 'expiry_date', 'valid_till',
        'policy_to', 'renewal_date', 'policy end date'
      ],
      relationship: ['relationship', 'insured_relation', 'member_relation', 'relation'],
      policyType: ['policy_type', 'scheme_name', 'product_name', 'plan_name']
    }
  },

  hospital: {
    fields: {
      hospitalName: [
        'hospital_name', 'provider_name', 'facility_name', 'hospital name',
        'clinic_name', 'nursing_home', 'hospital', 'provider', 'facility',
        'clinic', 'healthcare_provider', 'healthcare provider',
        'provider hospital', 'hospital provider'
      ],
      hospitalId: [
        'hospital_id', 'provider_id', 'facility_id', 'provider_code',
        'hospital code', 'provider code', 'hospitalid'
      ],
      rohiniId: ['rohini_id', 'rohini id', 'rohini_code'],
      gstin: ['gstin', 'gst_no', 'gst_number'],
      hospitalAddress: ['hospital_address', 'provider_address', 'facility_address']
    }
  },

  claim: {
    fields: {
      claimId: [
        'claim_id', 'claim_no', 'claim_number', 'txn_no', 'transaction_id',
        'pre_auth_no', 'preauth_no', 'claim id', 'claim no', 'claim'
      ],
      claimDate: [
        'claim_date', 'date_of_claim', 'submission_date',
        'claim_submission_date', 'claim date'
      ],
      claimType: ['claim_type', 'type_of_claim', 'claim_category'],
      claimedAmount: [
        'claimed_amount', 'claim_amount', 'total_claim_amount',
        'bill_amount', 'gross_amount', 'claimed amount', 'amount',
        'claim amount', 'bill amount', 'total amount', 'gross amount',
        'invoice amount', 'net amount', 'approved amount'
      ],
      admissionDate: [
        'admission_date', 'date_of_admission', 'doa', 'admit_date',
        'admission date'
      ],
      dischargeDate: [
        'discharge_date', 'date_of_discharge', 'dod', 'discharge_dt',
        'discharge date'
      ],
      hospitalizationType: [
        'hospitalization_type', 'type_of_hospitalization', 'admission_type',
        'patient_class', 'visit_type'
      ],
      priority: ['priority', 'urgency', 'claim_priority']
    }
  },

  diagnosis: {
    fields: {
      icdCode: [
        'icd_code', 'diagnosis_code', 'icd10_code', 'diagnosis code',
        'dx_code', 'icd_10_code', 'primary_dx', 'icd code'
      ],
      diagnosisName: [
        'diagnosis', 'diagnosis_name', 'disease_name', 'condition',
        'chief_complaint', 'illness', 'diagnosis_description',
        'disease', 'diagnosis description'
      ],
      onsetDate: ['onset_date', 'symptom_start_date', 'disease_onset']
    }
  },

  procedure: {
    fields: {
      procedureCode: [
        'procedure_code', 'cpt_code', 'icd_procedure_code',
        'service_code', 'procedure code'
      ],
      procedureName: [
        'procedure', 'procedure_name', 'treatment', 'service_description',
        'service_name', 'surgery_name', 'procedure name', 'service',
        'service description', 'operation', 'surgery'
      ],
      performedDate: [
        'procedure_date', 'surgery_date', 'treatment_date',
        'service_date', 'performed date'
      ]
    }
  },

  billing: {
    fields: {
      item1Name: [
        'item1_name', 'item1 name', 'service1_name', 'service1 name',
        'billing_item_1', 'bill_item_1', 'charge1_name', 'charge_1_name',
        'item_1_description', 'line_item_1', 'line1_name'
      ],
      item1Amount: [
        'item1_amount', 'item1 amount', 'service1_amount', 'service1 amount',
        'billing_item_1_amount', 'bill_item_1_amount', 'charge1_amount',
        'charge_1_amount', 'item_1_amount', 'line1_amount'
      ],
      item2Name: [
        'item2_name', 'item2 name', 'service2_name', 'service2 name',
        'billing_item_2', 'bill_item_2', 'charge2_name', 'charge_2_name',
        'item_2_description', 'line_item_2', 'line2_name'
      ],
      item2Amount: [
        'item2_amount', 'item2 amount', 'service2_amount', 'service2 amount',
        'billing_item_2_amount', 'bill_item_2_amount', 'charge2_amount',
        'charge_2_amount', 'item_2_amount', 'line2_amount'
      ],
      item3Name: [
        'item3_name', 'item3 name', 'service3_name', 'service3 name',
        'billing_item_3', 'bill_item_3', 'charge3_name', 'charge_3_name',
        'item_3_description', 'line_item_3', 'line3_name'
      ],
      item3Amount: [
        'item3_amount', 'item3 amount', 'service3_amount', 'service3 amount',
        'billing_item_3_amount', 'bill_item_3_amount', 'charge3_amount',
        'charge_3_amount', 'item_3_amount', 'line3_amount'
      ]
    }
  }
};

class LLMService {
  constructor() {
    this.provider = process.env.DEFAULT_LLM_PROVIDER || 'openai';
    this.openai = null;
    this.anthropic = null;
    this._initClients();
  }

  _isConfigured(key) {
    return (
      !!key &&
      key !== 'your_openai_api_key_here' &&
      key !== 'your_anthropic_api_key_here' &&
      key !== 'your_gemini_api_key_here' &&
      key.length > 10
    );
  }

  _initClients() {
    try {
      if (this._isConfigured(process.env.OPENAI_API_KEY)) {
        const { default: OpenAI } = require('openai');
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        logger.info('OpenAI client initialized');
      }
    } catch (e) {
      logger.warn('OpenAI init failed: ' + e.message);
    }

    try {
      if (this._isConfigured(process.env.ANTHROPIC_API_KEY)) {
        const Anthropic = require('@anthropic-ai/sdk');
        this.anthropic = new (Anthropic.default || Anthropic)({
          apiKey: process.env.ANTHROPIC_API_KEY
        });
        logger.info('Anthropic client initialized');
      }
    } catch (e) {
      logger.warn('Anthropic init failed: ' + e.message);
    }
  }

  get hasLLM() {
    return !!(
      this.openai ||
      this.anthropic ||
      this._isConfigured(process.env.GOOGLE_GEMINI_API_KEY)
    );
  }

  async inferSchemaMapping(headers, sampleRow = null) {
    const ruleMapping = this._ruleBasedMapping(headers, sampleRow);

    if (!this.hasLLM) {
      logger.info('No LLM configured — using rule-based mapping');
      return ruleMapping;
    }

    const prompt = `You are a healthcare data mapping expert for Indian NHCX/ABDM systems.

Map these source columns to correct FHIR target field names.

Source columns:
${JSON.stringify(headers)}

Sample data row:
${sampleRow ? JSON.stringify(sampleRow) : '{}'}

Available target fields:
${this._allTargetFields().join(', ')}

Important rules:
- Patient name must map only to actual patient/member/insured name.
- Hospital name must not map to patientName.
- Procedure/treatment/service must not map to patientName.
- Hospital ID must not map to hospitalName.
- IP/OP should map to hospitalizationType, not hospitalName.
- Amount/bill/claim amount should map to claimedAmount unless clearly item-wise amount.
- Billing item columns should map to item1Name/item1Amount/item2Name/item2Amount/item3Name/item3Amount.
- Return ONLY JSON object.`;

    try {
      let result;

      if (this.provider === 'anthropic' && this.anthropic) {
        result = await this._callAnthropic(prompt);
      } else if (this.openai) {
        result = await this._callOpenAI(prompt);
      } else if (this._isConfigured(process.env.GOOGLE_GEMINI_API_KEY)) {
        result = await this._callGemini(prompt);
      } else {
        return ruleMapping;
      }

      const llmMapping = this._parseJSON(result);
      const merged = { ...ruleMapping };
      const allowedTargets = this._allTargetFields();

      for (const [k, v] of Object.entries(llmMapping)) {
        if (headers.includes(k) && (v === null || allowedTargets.includes(v))) {
          merged[k] = v;
        }
      }

      return this._sanitizeMapping(merged, sampleRow);
    } catch (e) {
      logger.warn(`LLM mapping failed, using rule-based: ${e.message}`);
      return this._sanitizeMapping(ruleMapping, sampleRow);
    }
  }

  async extractFromFreeText(text, useCase) {
    if (!this.hasLLM) {
      throw new Error('No LLM API key configured.');
    }

    const prompt = `Extract healthcare claim data for ${useCase}. Return ONLY JSON.

Text:
${text}

Fields:
patientName, gender, dob, abhaId, phone, address, city, state, pincode,
policyNumber, insurerName, memberId, sumInsured, policyStartDate, policyEndDate,
relationship, hospitalName, hospitalId, rohiniId, claimId, claimDate, claimedAmount,
admissionDate, dischargeDate, icdCode, diagnosisName, procedureName, procedureCode,
item1Name, item1Amount, item2Name, item2Amount, item3Name, item3Amount, notes`;

    let result;

    if (this.provider === 'anthropic' && this.anthropic) {
      result = await this._callAnthropic(prompt);
    } else if (this.openai) {
      result = await this._callOpenAI(prompt);
    } else {
      result = await this._callGemini(prompt);
    }

    return this._parseJSON(result);
  }

  async validateAndSuggest(fhirBundle) {
    if (!this.hasLLM) {
      return {
        valid: true,
        errors: [],
        warnings: [],
        suggestions: ['Add an LLM API key for AI-powered validation']
      };
    }

    const prompt = `Review this FHIR R4 / NHCX bundle. Return ONLY JSON:
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "suggestions": []
}

Bundle:
${JSON.stringify(fhirBundle, null, 2).substring(0, 3000)}`;

    try {
      let result;

      if (this.provider === 'anthropic' && this.anthropic) {
        result = await this._callAnthropic(prompt);
      } else if (this.openai) {
        result = await this._callOpenAI(prompt);
      } else {
        result = await this._callGemini(prompt);
      }

      return this._parseJSON(result);
    } catch {
      return { valid: true, errors: [], warnings: [], suggestions: [] };
    }
  }

  async _callOpenAI(prompt) {
    const res = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2000
    });

    return res.choices[0].message.content;
  }

  async _callAnthropic(prompt) {
    const res = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    return res.content[0].text;
  }

  async _callGemini(prompt) {
    const axios = require('axios');

    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { timeout: 30000 }
    );

    return res.data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  }

  _parseJSON(text) {
    try {
      const cleaned = (text || '')
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      return JSON.parse(cleaned);
    } catch {
      const match = text?.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {}
      }
      return {};
    }
  }

  _ruleBasedMapping(headers, sampleRow = null) {
    const mapping = {};

    for (const header of headers) {
      const norm = normalize(header);
      let matched = null;

      for (const [, schema] of Object.entries(MASTER_SCHEMA)) {
        for (const [fieldName, aliases] of Object.entries(schema.fields || {})) {
          for (const alias of aliases) {
            const normAlias = normalize(alias);

            if (
              norm === normAlias ||
              norm.endsWith('_' + normAlias) ||
              norm.startsWith(normAlias + '_')
            ) {
              matched = fieldName;
              break;
            }
          }
          if (matched) break;
        }
        if (matched) break;
      }

      if (!matched) matched = this._smartGuess(header, sampleRow?.[header]);

      mapping[header] = matched;
    }

    return this._sanitizeMapping(mapping, sampleRow);
  }

  _smartGuess(header, sampleValue) {
    const h = normalize(header);
    const v = String(sampleValue || '').toLowerCase();

    if (h.includes('patient') && h.includes('name')) return 'patientName';
    if (h.includes('member') && h.includes('name')) return 'patientName';
    if (h.includes('insured') && h.includes('name')) return 'patientName';
    if (h.includes('beneficiary') && h.includes('name')) return 'patientName';

    if (h.includes('hospital') && h.includes('name')) return 'hospitalName';
    if (h.includes('provider') && h.includes('name')) return 'hospitalName';
    if (h.includes('facility') && h.includes('name')) return 'hospitalName';

    if (h.includes('insurer') || h.includes('payer') || h.includes('insurance_company')) return 'insurerName';

    if (h.includes('policy')) return 'policyNumber';
    if (h.includes('member') && h.includes('id')) return 'memberId';

    if (
      h === 'amount' ||
      h.endsWith('_amount') ||
      h.includes('bill_amount') ||
      h.includes('claim_amount') ||
      h.includes('total_amount')
    ) return 'claimedAmount';

    if (
      h.includes('procedure') ||
      h.includes('treatment') ||
      h.includes('service') ||
      h.includes('operation') ||
      h.includes('surgery')
    ) return 'procedureName';

    if (
      h.includes('diagnosis') ||
      h.includes('disease') ||
      h.includes('condition') ||
      h.includes('chief_complaint')
    ) return 'diagnosisName';

    if (v === 'm' || v === 'f' || v === 'male' || v === 'female') return 'gender';

    return null;
  }

  _sanitizeMapping(mapping, sampleRow = null) {
    const cleaned = { ...mapping };

    for (const [source, target] of Object.entries(cleaned)) {
      const sourceNorm = normalize(source);
      const value = sampleRow ? String(sampleRow[source] || '').toLowerCase() : '';

      if (target === 'patientName') {
        if (
          sourceNorm.includes('hospital') ||
          sourceNorm.includes('provider') ||
          sourceNorm.includes('procedure') ||
          sourceNorm.includes('service') ||
          sourceNorm.includes('treatment') ||
          value.includes('hospital') ||
          value.includes('hemodialysis')
        ) cleaned[source] = null;
      }

      if (target === 'hospitalName') {
        if (
          sourceNorm.includes('id') ||
          sourceNorm.includes('code') ||
          ['ip', 'op', 'inpatient', 'outpatient'].includes(value)
        ) {
          cleaned[source] = sourceNorm.includes('hospital') && sourceNorm.includes('id') ? 'hospitalId' : null;
        }
      }

      if (target === 'claimedAmount') {
        if (sourceNorm.includes('name') || sourceNorm.includes('description')) cleaned[source] = null;
      }
    }

    return cleaned;
  }

  _allTargetFields() {
    const fields = [];
    for (const schema of Object.values(MASTER_SCHEMA)) {
      for (const fieldName of Object.keys(schema.fields || {})) fields.push(fieldName);
    }
    return fields;
  }

  getMasterSchema() {
    return MASTER_SCHEMA;
  }
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[\s\-\.\/]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

const service = new LLMService();

module.exports = service;
module.exports.MASTER_SCHEMA = MASTER_SCHEMA;