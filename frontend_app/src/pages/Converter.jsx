import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Upload, FileSpreadsheet, Code2, Wand2, MessageSquare, ChevronDown,
  CheckCircle2, AlertCircle, Download, Copy, RefreshCw, Eye,
  FileText, Loader2, ArrowRight, ChevronRight, X, Zap, Shield, Terminal
} from 'lucide-react';
import { convertAPI } from '../services/api';
import FHIRBundleViewer from '../components/FHIRBundleViewer';
import MappingEditor from '../components/MappingEditor';
import clsx from 'clsx';

const USE_CASES = [
  { id: 'coverage-eligibility', label: 'Coverage Eligibility', icon: Shield, color: '#0ea5e9' },
  { id: 'claim', label: 'Claim', icon: FileText, color: '#0d9488' },
  { id: 'preauth', label: 'Pre-Authorization', icon: CheckCircle2, color: '#f97316' },
  { id: 'communication', label: 'Communication', icon: MessageSquare, color: '#8b5cf6' },
];

const INPUT_TABS = [
  { id: 'file', label: 'File Upload', icon: Upload },
  { id: 'hl7', label: 'HL7 Message', icon: Terminal },
  { id: 'json', label: 'JSON / Direct', icon: Code2 },
  { id: 'freetext', label: 'Free Text (AI)', icon: Wand2 },
];

const STEPS = ['Input', 'Map Fields', 'Convert', 'Output'];

export default function Converter() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [inputTab, setInputTab] = useState('file');
  const [useCase, setUseCase] = useState(searchParams.get('useCase') || 'claim');
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [fieldMapping, setFieldMapping] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [hl7Text, setHl7Text] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [freeText, setFreeText] = useState('');
  const [validation, setValidation] = useState(null);

  // File drop
  const onDrop = useCallback(async (accepted) => {
    if (!accepted.length) return;
    const f = accepted[0];
    setFile(f);
    setLoading(true);
    setLoadingMsg('Parsing file & inferring schema with AI...');
    try {
      const res = await convertAPI.previewFile(f);
      setPreviewData(res.data);
      setFieldMapping(res.data.inferredMapping || {});
      setStep(1);
      toast.success(`Parsed ${res.data.totalRows} records from ${res.data.format.toUpperCase()}`);
    } catch (e) {
      toast.error('Failed to parse file: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/xml': ['.xml'],
      'application/json': ['.json'],
      'text/plain': ['.hl7', '.txt']
    },
    multiple: false
  });

  const handleConvert = async () => {
    setLoading(true);
    setLoadingMsg('Building NHCX-aligned FHIR bundle...');
    try {
      let res;
      if (inputTab === 'file' && file) {
        res = await convertAPI.convertFile(file, useCase, { customMapping: fieldMapping });
      } else if (inputTab === 'hl7') {
        if (!hl7Text.trim()) { toast.error('Paste an HL7 message'); return; }
        res = await convertAPI.convertHL7(hl7Text, useCase);
      } else if (inputTab === 'json') {
        let parsed;
        try { parsed = JSON.parse(jsonText); } catch { toast.error('Invalid JSON'); return; }
        res = await convertAPI.convertJSON(parsed, useCase);
      } else if (inputTab === 'freetext') {
        if (!freeText.trim()) { toast.error('Enter some text'); return; }
        res = await convertAPI.convertFreeText(freeText, useCase);
      }

      setResult(res.data);
      setStep(3);
      toast.success(`Generated ${res.data.bundlesGenerated} FHIR bundle(s)`);

      // Validate
      if (res.data.bundles?.[0]) {
        const val = await convertAPI.validateBundle(res.data.bundles[0]);
        setValidation(val.data);
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadBundle = (bundle, idx) => {
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nhcx_fhir_bundle_${idx + 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    if (!result?.bundles) return;
    result.bundles.forEach((b, i) => downloadBundle(b, i));
  };

  const copyBundle = (bundle) => {
    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    toast.success('Bundle copied to clipboard');
  };

  const reset = () => {
    setStep(0); setFile(null); setPreviewData(null);
    setFieldMapping({}); setResult(null); setValidation(null);
    setHl7Text(''); setJsonText(''); setFreeText('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">FHIR Converter</h1>
          <p className="text-slate-400 text-sm mt-1 font-body">Transform legacy healthcare data to NHCX-aligned FHIR bundles</p>
        </div>
        {(step > 0 || result) && (
          <button onClick={reset} className="btn-secondary flex items-center gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> New Conversion
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer',
              i === step ? 'text-white' : i < step ? 'text-emerald-400' : 'text-slate-500'
            )}
              style={i === step ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' } : {}}
              onClick={() => { if (i < step) setStep(i); }}>
              <div className={clsx(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-emerald-400 text-white' : 'bg-slate-700 text-slate-400'
              )}>
                {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {s}
            </div>
            {i < STEPS.length - 1 && <div className="step-connector mx-2" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0: Input */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Use Case Selector */}
          <div className="card">
            <div className="font-display font-semibold text-white mb-4 text-sm">Select Use Case</div>
            <div className="grid grid-cols-4 gap-3">
              {USE_CASES.map(uc => {
                const Icon = uc.icon;
                const active = useCase === uc.id;
                return (
                  <button key={uc.id} onClick={() => setUseCase(uc.id)}
                    className={clsx('p-4 rounded-xl text-left transition-all duration-150', active ? '' : 'hover:bg-slate-800/30')}
                    style={active
                      ? { background: `${uc.color}12`, border: `1px solid ${uc.color}40` }
                      : { background: 'rgba(7,26,18,0.5)', border: '1px solid rgba(26,74,48,0.4)' }}>
                    <Icon className="w-5 h-5 mb-2" style={{ color: uc.color }} />
                    <div className="text-white text-xs font-semibold font-display">{uc.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Type Tabs */}
          <div className="card">
            <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(7,26,18,0.7)', border: '1px solid rgba(26,74,48,0.3)' }}>
              {INPUT_TABS.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setInputTab(t.id)}
                    className={clsx('flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150',
                      inputTab === t.id ? 'text-white' : 'text-slate-400 hover:text-slate-200')}
                    style={inputTab === t.id ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' } : {}}>
                    <Icon className="w-4 h-4" />{t.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {inputTab === 'file' && (
                <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div {...getRootProps()}
                    className={clsx(
                      'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200',
                      isDragActive ? 'dropzone-active border-sky-400 bg-emerald-400/5' : 'border-emerald-900/50 hover:border-emerald-700'
                    )}>
                    <input {...getInputProps()} />
                    {loading ? (
                      <div className="space-y-3">
                        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
                        <p className="text-slate-300 text-sm">{loadingMsg}</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-300 font-medium mb-1">Drop your file here or click to browse</p>
                        <p className="text-slate-500 text-sm">CSV, Excel, XML, JSON, HL7 (up to 10MB)</p>
                        <div className="flex justify-center gap-2 mt-4">
                          {['.csv', '.xlsx', '.xml', '.json', '.hl7'].map(e => (
                            <span key={e} className="tag-blue text-xs">{e}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {inputTab === 'hl7' && (
                <motion.div key="hl7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <p className="text-slate-400 text-sm">Paste an HL7 v2.x message (ADT, ORM, ORU, etc.)</p>
                  <textarea value={hl7Text} onChange={e => setHl7Text(e.target.value)}
                    className="input-field font-mono text-xs h-56 resize-none"
                    placeholder="MSH|^~\&|ADT|HOSPITAL|NHCX|ABDM|20240915120000||ADT^A01|..." />
                  <button onClick={handleConvert} disabled={loading} className="btn-primary flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Convert to FHIR
                  </button>
                </motion.div>
              )}

              {inputTab === 'json' && (
                <motion.div key="json" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <p className="text-slate-400 text-sm">Paste JSON data (object or array of records)</p>
                  <textarea value={jsonText} onChange={e => setJsonText(e.target.value)}
                    className="input-field font-mono text-xs h-56 resize-none"
                    placeholder='{"patientName": "John Doe", "policyNumber": "POL-001", ...}' />
                  <button onClick={handleConvert} disabled={loading} className="btn-primary flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Convert to FHIR
                  </button>
                </motion.div>
              )}

              {inputTab === 'freetext' && (
                <motion.div key="freetext" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
                    <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <p className="text-emerald-300 text-xs">AI-powered extraction — describe the patient, policy, diagnosis in natural language</p>
                  </div>
                  <textarea value={freeText} onChange={e => setFreeText(e.target.value)}
                    className="input-field text-sm h-56 resize-none"
                    placeholder="Patient Ramesh Kumar, male, DOB 15/06/1975, ABHA 98765432101234, admitted to Manipal Hospital on 10/09/2024, discharged 15/09/2024. Diagnosis: Hypertension (I10). Policy: Star Health POL-98765, sum insured 5 lakhs. Claimed amount: 85,000..." />
                  <button onClick={handleConvert} disabled={loading} className="btn-primary flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Extract & Convert
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Step 1: Mapping Editor */}
      {step === 1 && previewData && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <MappingEditor
            headers={previewData.headers}
            sampleRows={previewData.sampleRows}
            mapping={fieldMapping}
            masterSchema={previewData.masterSchema}
            onChange={setFieldMapping}
          />
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-secondary">← Back</button>
            <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2">
              Confirm Mapping <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Review & Convert */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="card space-y-4">
            <div className="font-display font-semibold text-white">Conversion Summary</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(7,26,18,0.7)', border: '1px solid rgba(26,74,48,0.4)' }}>
                <div className="text-slate-400 text-xs mb-1">Records to Convert</div>
                <div className="text-white text-2xl font-display font-bold">{previewData?.totalRows || '—'}</div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(7,26,18,0.7)', border: '1px solid rgba(26,74,48,0.4)' }}>
                <div className="text-slate-400 text-xs mb-1">Use Case</div>
                <div className="text-white text-lg font-display font-semibold capitalize">{useCase.replace('-', ' ')}</div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(7,26,18,0.7)', border: '1px solid rgba(26,74,48,0.4)' }}>
                <div className="text-slate-400 text-xs mb-1">Mapped Fields</div>
                <div className="text-white text-2xl font-display font-bold">{Object.values(fieldMapping).filter(Boolean).length}</div>
              </div>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {Object.entries(fieldMapping).filter(([, v]) => v).map(([src, tgt]) => (
                <div key={src} className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-slate-400 flex-1 min-w-0 truncate">{src}</span>
                  <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                  <span className="font-mono text-emerald-400 flex-1 min-w-0 truncate">{tgt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary">← Edit Mapping</button>
            <button onClick={handleConvert} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{loadingMsg}</>
              ) : (
                <><Wand2 className="w-4 h-4" />Generate FHIR Bundle</>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Output */}
      {step === 3 && result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Summary bar */}
          <div className="card flex items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-semibold font-display">Conversion Complete</span>
            </div>
            <div className="flex gap-4 text-sm text-slate-400">
              <span><span className="text-white font-semibold">{result.bundlesGenerated}</span> bundle(s)</span>
              <span><span className="text-white font-semibold">{result.totalRecords}</span> record(s)</span>
              <span><span className="text-white font-semibold uppercase">{result.format}</span> input</span>
            </div>
            {validation && (
              <div className="ml-auto flex items-center gap-2">
                {validation.valid
                  ? <span className="tag-green flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Valid FHIR</span>
                  : <span className="tag-red flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {validation.errors?.length} errors</span>
                }
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={downloadAll} className="btn-primary flex items-center gap-2 text-xs">
                <Download className="w-3.5 h-3.5" /> Download All
              </button>
            </div>
          </div>

          {/* Bundle viewer */}
          {result.bundles?.map((bundle, i) => (
            <FHIRBundleViewer
              key={i}
              bundle={bundle}
              index={i}
              onDownload={() => downloadBundle(bundle, i)}
              onCopy={() => copyBundle(bundle)}
              validation={i === 0 ? validation : null}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
