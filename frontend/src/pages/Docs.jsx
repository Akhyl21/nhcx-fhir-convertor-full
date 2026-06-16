import React, { useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const ENDPOINTS = [
  {
    method: 'POST', path: '/api/convert/file', tag: 'Convert',
    desc: 'Upload and convert CSV, Excel, XML, JSON, or HL7 files to NHCX FHIR bundle.',
    params: [
      { name: 'file', type: 'File', required: true, desc: 'The file to convert' },
      { name: 'useCase', type: 'string', required: true, desc: 'coverage-eligibility | claim | preauth | communication' },
      { name: 'useLLM', type: 'boolean', desc: 'Use AI for schema mapping (default: true)' },
      { name: 'customMapping', type: 'JSON string', desc: 'Override field mapping JSON' },
    ],
    response: '{ success, useCase, format, totalRecords, bundlesGenerated, fieldMapping, bundles[] }'
  },
  {
    method: 'POST', path: '/api/convert/hl7', tag: 'Convert',
    desc: 'Convert HL7 v2.x message text to FHIR bundle.',
    params: [
      { name: 'message', type: 'string', required: true, desc: 'HL7 v2.x message string' },
      { name: 'useCase', type: 'string', required: true, desc: 'Use case identifier' },
    ],
    response: '{ success, useCase, format: "hl7", bundles[] }'
  },
  {
    method: 'POST', path: '/api/convert/freetext', tag: 'LLM',
    desc: 'Extract data from free-text clinical notes and convert to FHIR (requires LLM API key).',
    params: [
      { name: 'text', type: 'string', required: true, desc: 'Free-form healthcare text' },
      { name: 'useCase', type: 'string', required: true, desc: 'Use case identifier' },
    ],
    response: '{ success, extractedData, bundles[] }'
  },
  {
    method: 'POST', path: '/api/convert/preview', tag: 'Convert',
    desc: 'Parse a file and return headers, sample data, and AI-inferred field mapping.',
    params: [
      { name: 'file', type: 'File', required: true, desc: 'File to preview' },
    ],
    response: '{ format, totalRows, headers[], sampleRows[], inferredMapping, masterSchema }'
  },
  {
    method: 'POST', path: '/api/convert/infer-mapping', tag: 'LLM',
    desc: 'Get AI-powered field mapping for arbitrary column headers.',
    params: [
      { name: 'headers', type: 'string[]', required: true, desc: 'Column header names' },
      { name: 'sampleRow', type: 'object', desc: 'Optional sample data row' },
    ],
    response: '{ mapping: { sourceCol: targetField } }'
  },
  {
    method: 'POST', path: '/api/validate/fhir-bundle', tag: 'Validate',
    desc: 'Validate a FHIR bundle for structural correctness and NHCX profile conformance.',
    params: [
      { name: 'bundle', type: 'object', required: true, desc: 'FHIR Bundle resource' },
    ],
    response: '{ valid, structuralErrors[], llmValidation: { errors, warnings, suggestions } }'
  },
  {
    method: 'GET', path: '/api/schema/master', tag: 'Schema',
    desc: 'Get master field schema with all supported FHIR field names and their aliases.',
    params: [],
    response: '{ masterSchema, profiles }'
  },
  {
    method: 'GET', path: '/api/schema/snomed', tag: 'Schema',
    desc: 'Get SNOMED CT code mappings for ICD-10, procedures, medications, body sites.',
    params: [],
    response: '{ snomedMappings: { icd10, procedures, medications, bodySites } }'
  },
  {
    method: 'GET', path: '/api/health', tag: 'System',
    desc: 'Health check endpoint. Returns service status and LLM provider availability.',
    params: [],
    response: '{ status, version, uptime, llmProviders: { openai, anthropic, gemini } }'
  },
];

const METHOD_COLORS = {
  GET: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
  POST: 'text-emerald-400 bg-sky-400/10 border-sky-400/25',
  PUT: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25',
};

const TAG_COLORS = {
  Convert: 'tag-blue', LLM: 'tag-orange', Validate: 'tag-green', Schema: 'bg-purple-400/10 text-purple-300 border border-purple-400/20 tag', System: 'tag'
};

export default function Docs() {
  const [open, setOpen] = useState({});
  const toggle = (i) => setOpen(v => ({ ...v, [i]: !v[i] }));

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-emerald-400" />
        <div>
          <h1 className="font-display text-2xl font-bold text-white">API Reference</h1>
          <p className="text-slate-400 text-sm mt-0.5">Base URL: <span className="font-mono text-emerald-400">http://localhost:5000</span></p>
        </div>
      </div>

      <div className="card">
        <div className="font-display font-semibold text-white mb-3">Quick Start</div>
        <div className="p-4 rounded-xl font-mono text-xs text-slate-300 leading-relaxed"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(30,58,95,0.4)' }}>
          <span className="text-slate-500"># Convert a CSV file</span>{'\n'}
          curl -X POST http://localhost:5000/api/convert/file \{'\n'}
          {'  '}-F "file=@claim_data.csv" \{'\n'}
          {'  '}-F "useCase=claim" \{'\n'}
          {'  '}-F "useLLM=true"{'\n\n'}
          <span className="text-slate-500"># Convert HL7 message</span>{'\n'}
          curl -X POST http://localhost:5000/api/convert/hl7 \{'\n'}
          {'  '}-H "Content-Type: application/json" \{'\n'}
          {'  '}-d {'\'{"message":"MSH|...", "useCase":"claim"}\''}
        </div>
      </div>

      <div className="space-y-2">
        {ENDPOINTS.map((ep, i) => (
          <div key={i} className="card overflow-hidden">
            <button onClick={() => toggle(i)} className="w-full flex items-center gap-4 text-left">
              <span className={clsx('text-xs font-mono font-bold px-2.5 py-1 rounded-md border', METHOD_COLORS[ep.method])}>
                {ep.method}
              </span>
              <span className="font-mono text-white text-sm">{ep.path}</span>
              <span className={clsx('text-xs', TAG_COLORS[ep.tag] || 'tag-blue')}>{ep.tag}</span>
              <span className="text-slate-400 text-xs ml-auto mr-2">{ep.desc}</span>
              <ChevronDown className={clsx('w-4 h-4 text-slate-500 transition-transform flex-shrink-0', open[i] && 'rotate-180')} />
            </button>

            {open[i] && (
              <div className="mt-4 space-y-4 pt-4 border-t border-slate-800/50">
                {ep.params.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-400 mb-2">Parameters</div>
                    <div className="space-y-1.5">
                      {ep.params.map(p => (
                        <div key={p.name} className="flex items-start gap-3 text-xs p-2 rounded-lg"
                          style={{ background: 'rgba(6,13,26,0.5)', border: '1px solid rgba(30,58,95,0.3)' }}>
                          <span className="font-mono text-emerald-400 w-28 flex-shrink-0">{p.name}</span>
                          <span className="text-slate-500 w-24 flex-shrink-0">{p.type}</span>
                          {p.required && <span className="tag-red text-xs">required</span>}
                          <span className="text-slate-400">{p.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-2">Response</div>
                  <div className="p-3 rounded-lg font-mono text-xs text-emerald-400"
                    style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(30,58,95,0.4)' }}>
                    {ep.response}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
