const express = require('express');
const healthRouter = express.Router();
const metricsRouter = express.Router();
const client = require('prom-client');

// Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const conversionCounter = new client.Counter({
  name: 'nhcx_conversions_total',
  help: 'Total FHIR conversions',
  labelNames: ['useCase', 'format', 'status'],
  registers: [register]
});

const conversionDuration = new client.Histogram({
  name: 'nhcx_conversion_duration_seconds',
  help: 'Time taken for FHIR conversion',
  labelNames: ['useCase'],
  registers: [register]
});

// Health check
healthRouter.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'nhcx-fhir-convertor',
    llmProviders: {
      openai: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here',
      anthropic: !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here',
      gemini: !!process.env.GOOGLE_GEMINI_API_KEY && process.env.GOOGLE_GEMINI_API_KEY !== 'your_gemini_api_key_here'
    }
  });
});

// Metrics endpoint
metricsRouter.get('/', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

module.exports = { healthRouter, metricsRouter, conversionCounter, conversionDuration };
