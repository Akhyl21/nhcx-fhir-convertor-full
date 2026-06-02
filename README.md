# 🏥 NHCX FHIR Convertor

**ABDM-Aligned Legacy-to-FHIR Transformation Microservice**

> Open-source microservice that transforms legacy healthcare data (HL7 v2.x, CSV, Excel, XML, JSON) into NHCX-aligned FHIR R4 bundles for Coverage Eligibility, Claim, Pre-Authorization, and Communication use cases.

[![FHIR R4](https://img.shields.io/badge/FHIR-R4-blue)](https://www.hl7.org/fhir/R4/)
[![ABDM](https://img.shields.io/badge/ABDM-Compliant-green)](https://abdm.gov.in)
[![NHCX](https://img.shields.io/badge/NHCX-v2.0-orange)](https://nhcx.gov.in)
[![Node.js](https://img.shields.io/badge/Node.js-20-brightgreen)](https://nodejs.org)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Schema Mapping** | LLM-powered field mapping — no headers required! |
| 🔄 **Multi-Format Input** | CSV, Excel, XML, JSON, HL7 v2.x, Free Text |
| 🏥 **NHCX Profiles** | Full conformance to ABDM/NHCX FHIR profiles |
| 🧬 **SNOMED CT** | Automatic ICD-10 → SNOMED CT code mapping |
| ✅ **Validation** | Structural + LLM-assisted FHIR validation |
| 📊 **Interactive UI** | Professional React dashboard with field mapper |
| 🔌 **REST API** | Fully documented microservice API |
| 🐳 **Docker Ready** | One-command deployment |

---

## 🚀 Quick Start (VS Code)

### Prerequisites
- Node.js 18+ 
- npm 9+

### 1. Clone & Install

```bash
git clone <repo-url>
cd nhcx-fhir-convertor
npm run install:all
```

### 2. Configure Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add at least one LLM API key:
```env
OPENAI_API_KEY=sk-...          # Recommended
ANTHROPIC_API_KEY=sk-ant-...   # Alternative
GOOGLE_GEMINI_API_KEY=...      # Alternative
```

> **Note:** Without LLM keys, the system falls back to rule-based mapping (still works great!)

### 3. Run Both Services

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → http://localhost:3000
```

### 4. Open the App
Visit **http://localhost:3000** 🎉

---

## 📁 Project Structure

```
nhcx-fhir-convertor/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express app entry point
│   │   ├── converters/
│   │   │   └── fhirConverter.js   # Main conversion orchestrator
│   │   ├── mappers/
│   │   │   └── snomedMapper.js    # SNOMED CT code mapping
│   │   ├── models/
│   │   │   └── fhirBuilders.js    # FHIR resource builders
│   │   ├── parsers/
│   │   │   └── fileParser.js      # CSV/Excel/XML/JSON/HL7 parser
│   │   ├── llm/
│   │   │   └── llmService.js      # AI schema inference (OpenAI/Anthropic/Gemini)
│   │   ├── routes/
│   │   │   ├── convert.js         # /api/convert endpoints
│   │   │   ├── validate.js        # /api/validate endpoints
│   │   │   ├── schema.js          # /api/schema endpoints
│   │   │   ├── llm.js             # /api/llm endpoints
│   │   │   └── health.js          # /api/health
│   │   └── utils/
│   │       ├── logger.js          # Winston logger
│   │       └── errorHandler.js    # Global error handler
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Router
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Home dashboard
│   │   │   ├── Converter.jsx      # Main converter UI (4-step wizard)
│   │   │   ├── Schema.jsx         # Schema explorer
│   │   │   ├── History.jsx        # Conversion history
│   │   │   └── Docs.jsx           # API documentation
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Sidebar + navigation
│   │   │   ├── FHIRBundleViewer.jsx  # Interactive FHIR viewer
│   │   │   └── MappingEditor.jsx  # Field mapping UI
│   │   └── services/
│   │       └── api.js             # Axios API client
│   └── package.json
│
├── samples/
│   ├── csv/sample_claim.csv
│   ├── csv/sample_eligibility.csv
│   ├── hl7/sample_adt_a01.hl7
│   └── json/sample_claim.json
│
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Reference

### Convert File
```http
POST /api/convert/file
Content-Type: multipart/form-data

file:      <csv|xlsx|xml|json|hl7>
useCase:   coverage-eligibility | claim | preauth | communication
useLLM:    true | false (default: true)
```

### Convert HL7 Message
```http
POST /api/convert/hl7
Content-Type: application/json

{
  "message": "MSH|^~\\&|ADT|...",
  "useCase": "claim"
}
```

### Extract from Free Text (AI)
```http
POST /api/convert/freetext
Content-Type: application/json

{
  "text": "Patient Ramesh, DOB 15/06/1975, diagnosed with hypertension I10...",
  "useCase": "claim"
}
```

### Validate Bundle
```http
POST /api/validate/fhir-bundle
Content-Type: application/json

{
  "bundle": { "resourceType": "Bundle", ... }
}
```

---

## 🏗️ NHCX FHIR Resources Generated

| Resource | Use Case |
|---|---|
| `Patient` | All |
| `Organization` (provider + insurer) | All |
| `Coverage` | All |
| `CoverageEligibilityRequest` | Coverage Eligibility |
| `Claim` | Claim, Pre-Auth |
| `Communication` | Communication |
| `Condition` | Claim, Pre-Auth |
| `Procedure` | Claim, Pre-Auth |

---

## 🧬 SNOMED CT Mapping

Automatic ICD-10 → SNOMED CT mapping for:
- **Diagnoses**: ICD-10 codes (I10→38341003, E11→44054006, etc.)
- **Procedures**: ECG, Echo, CT, MRI, dialysis, chemotherapy, etc.
- **Medications**: Common Indian medications
- **Body Sites**: Anatomical structures

---

## 🐳 Docker Deployment

```bash
# Create .env with your LLM API keys
cp backend/.env.example .env

# Build and run
docker-compose up -d --build

# Access at http://localhost:3000
```

---

## 📋 Sample Files

| File | Description |
|---|---|
| `samples/csv/sample_claim.csv` | Multi-patient claim data |
| `samples/csv/sample_eligibility.csv` | Coverage eligibility requests |
| `samples/hl7/sample_adt_a01.hl7` | HL7 ADT^A01 admission message |
| `samples/json/sample_claim.json` | JSON claim with billing items |

---

## 🏆 Hackathon Highlights

1. **Zero-header AI mapping** — Upload any CSV; LLM maps headers automatically
2. **Master Schema** — 50+ field aliases across 6 categories
3. **Multi-LLM** — OpenAI GPT-4o, Anthropic Claude, Google Gemini support
4. **Full NHCX compliance** — All NRCES FHIR profile URLs
5. **HL7 v2.x parsing** — MSH, PID, IN1, DG1, PR1, PV1 segments
6. **SNOMED CT auto-mapping** — Dual coding (ICD-10 + SNOMED CT)
7. **Reusable microservice** — Embed in any HMIS via REST API
8. **Interactive FHIR viewer** — Drill down resources with syntax highlighting

---

## 📄 License

MIT © 2024 — Open Source for ABDM Healthcare Interoperability
