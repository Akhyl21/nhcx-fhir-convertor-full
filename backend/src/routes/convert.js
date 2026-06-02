const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { parseFile, parseHL7String } = require('../parsers/fileParser');
const { convertToFHIR, applyMapping } = require('../converters/fhirConverter');
const { validateBundle } = require('../utils/fhirValidator');
const llmService = require('../llm/llmService');
const logger = require('../utils/logger');

// Upload folder
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.xml', '.json', '.hl7', '.txt'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`File type not supported. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }

    cb(null, true);
  }
});

function cleanupFile(filePath) {
  if (filePath) {
    fs.unlink(filePath, err => {
      if (err) logger.warn(`Upload cleanup failed: ${err.message}`);
    });
  }
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).toLowerCase() === 'true';
}

function validateUseCase(useCase) {
  const allowed = ['claim', 'preauth', 'coverage-eligibility', 'communication'];
  return allowed.includes(useCase) ? useCase : 'claim';
}

async function getFieldMapping(parsed, customMapping, useLLM) {
  if (customMapping) {
    try {
      return typeof customMapping === 'string' ? JSON.parse(customMapping) : customMapping;
    } catch {
      throw new Error('Invalid customMapping JSON');
    }
  }

  if (useLLM && llmService.hasLLM) {
    return await llmService.inferSchemaMapping(parsed.headers, parsed.rows[0]);
  }

  return llmService._ruleBasedMapping(parsed.headers, parsed.rows[0]);
}

function buildValidationResults(bundles) {
  return bundles.map(b => ({
    bundleId: b.id,
    validation: validateBundle(b)
  }));
}

/**
 * POST /api/convert/file
 * Upload a file and convert to FHIR bundle
 */
router.post('/file', upload.single('file'), async (req, res, next) => {
  const filePath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const useCase = validateUseCase(req.body.useCase || 'claim');
    const useLLM = parseBoolean(req.body.useLLM, false);
    const validateWithLLM = parseBoolean(req.body.validateWithLLM, false);

    const parsed = await parseFile(filePath);

    logger.info(`Parsed ${parsed.totalRows} rows from ${parsed.format} file`);

    if (!parsed.rows || parsed.rows.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'No usable records found in uploaded file'
      });
    }

    const fieldMapping = await getFieldMapping(parsed, req.body.customMapping, useLLM);

    const mappedRows = parsed.rows.map(row => applyMapping(row, fieldMapping));

    const bundles = await convertToFHIR(mappedRows, useCase, { validateWithLLM });

    const validationResults = buildValidationResults(bundles);

    cleanupFile(filePath);

    return res.json({
      success: true,
      useCase,
      format: parsed.format,
      totalRecords: parsed.totalRows,
      bundlesGenerated: bundles.length,
      fieldMapping,
      previewMappedRecord: mappedRows[0] || null,
      bundles,
      validationResults
    });
  } catch (error) {
    cleanupFile(filePath);
    next(error);
  }
});

/**
 * POST /api/convert/json
 * Convert structured JSON data directly
 */
router.post('/json', async (req, res, next) => {
  try {
    const {
      data,
      useCase = 'claim',
      fieldMapping = null,
      useLLM = false,
      validateWithLLM = false
    } = req.body;

    if (!data) {
      return res.status(400).json({ success: false, error: 'data field is required' });
    }

    const normalizedUseCase = validateUseCase(useCase);
    const records = Array.isArray(data) ? data : [data];

    const headers = records.length ? Object.keys(records[0]) : [];
    const parsed = {
      headers,
      rows: records,
      format: 'json',
      totalRows: records.length
    };

    let finalMapping = fieldMapping;

    if (!finalMapping) {
      finalMapping = await getFieldMapping(parsed, null, parseBoolean(useLLM, false));
    }

    const mappedRecords = records.map(row => applyMapping(row, finalMapping));

    const bundles = await convertToFHIR(mappedRecords, normalizedUseCase, {
      validateWithLLM: parseBoolean(validateWithLLM, false)
    });

    const validationResults = buildValidationResults(bundles);

    return res.json({
      success: true,
      useCase: normalizedUseCase,
      format: 'json',
      totalRecords: records.length,
      bundlesGenerated: bundles.length,
      fieldMapping: finalMapping,
      previewMappedRecord: mappedRecords[0] || null,
      bundles,
      validationResults
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/convert/hl7
 * Convert HL7 v2.x message text
 */
router.post('/hl7', async (req, res, next) => {
  try {
    const { message, useCase = 'claim', validateWithLLM = false } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'message field is required' });
    }

    const parsed = parseHL7String(message);

    const bundles = await convertToFHIR(parsed.rows, validateUseCase(useCase), {
      validateWithLLM: parseBoolean(validateWithLLM, false)
    });

    const validationResults = buildValidationResults(bundles);

    return res.json({
      success: true,
      useCase: validateUseCase(useCase),
      format: 'hl7',
      totalRecords: parsed.totalRows,
      hl7Segments: parsed.hl7Segments,
      previewParsedRecord: parsed.rows[0] || null,
      bundlesGenerated: bundles.length,
      bundles,
      validationResults
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/convert/freetext
 * Convert free text using LLM extraction
 */
router.post('/freetext', async (req, res, next) => {
  try {
    const { text, useCase = 'claim', validateWithLLM = false } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'text field is required' });
    }

    if (!llmService.hasLLM) {
      return res.status(422).json({
        success: false,
        error: 'Free text extraction requires an LLM API key'
      });
    }

    const extractedData = await llmService.extractFromFreeText(text, validateUseCase(useCase));

    if (!extractedData || Object.keys(extractedData).length === 0) {
      return res.status(422).json({
        success: false,
        error: 'Could not extract structured data from text'
      });
    }

    const bundles = await convertToFHIR([extractedData], validateUseCase(useCase), {
      validateWithLLM: parseBoolean(validateWithLLM, false)
    });

    const validationResults = buildValidationResults(bundles);

    return res.json({
      success: true,
      useCase: validateUseCase(useCase),
      format: 'freetext',
      totalRecords: 1,
      extractedData,
      bundlesGenerated: bundles.length,
      bundles,
      validationResults
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/convert/infer-mapping
 */
router.post('/infer-mapping', async (req, res, next) => {
  try {
    const { headers, sampleRow, useLLM = false } = req.body;

    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({ success: false, error: 'headers array is required' });
    }

    const mapping = await getFieldMapping(
      {
        headers,
        rows: sampleRow ? [sampleRow] : [],
        format: 'manual',
        totalRows: sampleRow ? 1 : 0
      },
      null,
      parseBoolean(useLLM, false)
    );

    return res.json({
      success: true,
      headers,
      mapping,
      masterSchema: llmService.getMasterSchema()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/convert/preview
 */
router.post('/preview', upload.single('file'), async (req, res, next) => {
  const filePath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const useLLM = parseBoolean(req.body.useLLM, false);
    const parsed = await parseFile(filePath);

    const inferredMapping = await getFieldMapping(parsed, null, useLLM);

    const previewMappedRows = parsed.rows
      .slice(0, 3)
      .map(row => applyMapping(row, inferredMapping));

    cleanupFile(filePath);

    return res.json({
      success: true,
      format: parsed.format,
      totalRows: parsed.totalRows,
      headers: parsed.headers,
      sampleRows: parsed.rows.slice(0, 3),
      inferredMapping,
      previewMappedRows,
      masterSchema: llmService.getMasterSchema()
    });
  } catch (error) {
    cleanupFile(filePath);
    next(error);
  }
});

// Multer-specific errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File too large. Maximum allowed size is 10MB.'
      });
    }

    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  if (error.message && error.message.includes('File type not supported')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  next(error);
});

module.exports = router;