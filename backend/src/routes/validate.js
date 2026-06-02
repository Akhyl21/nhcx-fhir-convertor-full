const express = require('express');
const router  = express.Router();
const llmService    = require('../llm/llmService');
const logger        = require('../utils/logger');
const { validateBundle } = require('../utils/fhirValidator');

/**
 * POST /api/validate/fhir-bundle
 * Full rule-based + optional LLM validation
 */
router.post('/fhir-bundle', async (req, res, next) => {
  try {
    const { bundle } = req.body;
    if (!bundle) return res.status(400).json({ error: 'bundle is required' });

    // Rule-based validation (always runs)
    const ruleResult = validateBundle(bundle);

    // LLM-assisted validation (optional, if keys present)
    let llmValidation = null;
    if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
      try {
        llmValidation = await llmService.validateAndSuggest(bundle);
      } catch (e) {
        logger.warn('LLM validation skipped:', e.message);
      }
    }

    res.json({
      valid: ruleResult.valid,
      summary: ruleResult.summary,
      profileCheck:       ruleResult.profileCheck,
      mandatoryFields:    ruleResult.mandatoryFields,
      referenceIntegrity: ruleResult.referenceIntegrity,
      terminologyCheck:   ruleResult.terminologyCheck,
      details:            ruleResult.details,
      llmValidation,
      resourceCount: bundle.entry?.length || 0,
      resourceTypes: [...new Set((bundle.entry || []).map(e => e.resource?.resourceType))]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
