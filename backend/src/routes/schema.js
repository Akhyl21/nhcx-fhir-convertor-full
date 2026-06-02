const express = require('express');
const router = express.Router();
const { MASTER_SCHEMA } = require('../llm/llmService');
const { SNOMED_MAPPINGS } = require('../mappers/snomedMapper');
const { NHCX_PROFILES } = require('../models/fhirBuilders');

router.get('/master', (req, res) => {
  res.json({ masterSchema: MASTER_SCHEMA, profiles: NHCX_PROFILES });
});

router.get('/snomed', (req, res) => {
  res.json({ snomedMappings: SNOMED_MAPPINGS });
});

router.get('/use-cases', (req, res) => {
  res.json({
    useCases: [
      { id: 'coverage-eligibility', label: 'Coverage Eligibility', description: 'Check patient insurance coverage' },
      { id: 'claim', label: 'Claim Submission', description: 'Submit insurance claim' },
      { id: 'preauth', label: 'Pre-Authorization', description: 'Request pre-authorization' },
      { id: 'communication', label: 'Communication', description: 'Send medical records / documents' }
    ]
  });
});

module.exports = router;
