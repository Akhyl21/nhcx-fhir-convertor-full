const express = require('express');
const router = express.Router();
const llmService = require('../llm/llmService');

router.get('/status', (req, res) => {
  res.json({
    defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'openai',
    available: {
      openai: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here',
      anthropic: !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here',
      gemini: !!process.env.GOOGLE_GEMINI_API_KEY && process.env.GOOGLE_GEMINI_API_KEY !== 'your_gemini_api_key_here'
    }
  });
});

router.post('/extract', async (req, res, next) => {
  try {
    const { text, useCase = 'claim' } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    const result = await llmService.extractFromFreeText(text, useCase);
    res.json({ success: true, extractedData: result });
  } catch (e) { next(e); }
});

router.post('/map-headers', async (req, res, next) => {
  try {
    const { headers, sampleRow } = req.body;
    const mapping = await llmService.inferSchemaMapping(headers, sampleRow);
    res.json({ success: true, mapping });
  } catch (e) { next(e); }
});

module.exports = router;
