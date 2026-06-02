const express = require('express');
const router = express.Router();
const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

router.get('/', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

module.exports = router;
