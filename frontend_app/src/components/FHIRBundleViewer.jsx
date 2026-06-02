import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Copy, ChevronDown, CheckCircle2, AlertCircle, User, Building2, Shield, FileText, Activity, MessageSquare, Stethoscope } from 'lucide-react';
import clsx from 'clsx';

const RESOURCE_ICONS = { Patient: User, Organization: Building2, Coverage: Shield, Claim: FileText, CoverageEligibilityRequest: Activity, Communication: MessageSquare, Condition: Stethoscope, Procedure: Activity };
const RESOURCE_COLORS = { Patient: '#0ea5e9', Organization: '#059669', Coverage: '#d97706', Claim: '#10b981', CoverageEligibilityRequest: '#6366f1', Communication: '#8b5cf6', Condition: '#ef4444', Procedure: '#f59e0b' };
const RESOURCE_BG = { Patient: '#eff6ff', Organization: '#f0fdf4', Coverage: '#fffbeb', Claim: '#f0fdf4', CoverageEligibilityRequest: '#eef2ff', Communication: '#f5f3ff', Condition: '#fef2f2', Procedure: '#fffbeb' };

function JsonNode({ data, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2);
  if (data === null) return <span className="text-slate-400">null</span>;
  if (typeof data === 'boolean') return <span className="text-purple-600">{String(data)}</span>;
  if (typeof data === 'number') return <span className="text-amber-600">{data}</span>;
  if (typeof data === 'string') return <span className="text-emerald-700">"{data}"</span>;
  if (Array.isArray(data)) {
    if (!data.length) return <span className="text-slate-400">[]</span>;
    return (
      <span>
        <button onClick={() => setExpanded(v => !v)} className="text-slate-500 hover:text-slate-700 text-xs">
          {expanded ? '▼' : '▶'} [{data.length}]
        </button>
        {expanded && (
          <div className="ml-4 border-l-2 border-emerald-900 pl-3 mt-1 space-y-1">
            {data.map((item, i) => <div key={i}><span className="text-slate-400 text-xs">{i}: </span><JsonNode data={item} depth={depth + 1} /></div>)}
          </div>
        )}
      </span>
    );
  }
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (!keys.length) return <span className="text-slate-400">{'{}'}</span>;
    return (
      <span>
        <button onClick={() => setExpanded(v => !v)} className="text-slate-500 hover:text-slate-700 text-xs">
          {expanded ? '▼' : '▶'} {'{'}…{'}'}
        </button>
        {expanded && (
          <div className="ml-4 border-l-2 border-emerald-900 pl-3 mt-0.5 space-y-0.5">
            {keys.map(key => (
              <div key={key} className="flex gap-2 items-start">
                <span className="text-emerald-400 text-xs flex-shrink-0 font-medium">{key}:</span>
                <JsonNode data={data[key]} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }
  return <span className="text-slate-700">{String(data)}</span>;
}

function ResourceCard({ entry }) {
  const [open, setOpen] = useState(false);
  const rt = entry.resource?.resourceType;
  const Icon = RESOURCE_ICONS[rt] || FileText;
  const color = RESOURCE_COLORS[rt] || '#64748b';
  const bg = RESOURCE_BG[rt] || '#071a12';

  const getTitle = () => {
    const r = entry.resource;
    if (rt === 'Patient') return r.name?.[0]?.text || r.id;
    if (rt === 'Organization') return r.name || r.id;
    if (rt === 'Coverage') return `Policy: ${r.subscriberId || r.id}`;
    if (rt === 'Claim') return `Claim: ${r.id}`;
    if (rt === 'Condition') return r.code?.text || r.id;
    if (rt === 'Procedure') return r.code?.text || r.id;
    return r.id || rt;
  };

  return (
    <div className="rounded-xl overflow-hidden border transition-all" style={{ borderColor: `${color}30`, background: 'white' }}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-emerald-950/30 transition-colors">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg, border: `1px solid ${color}30` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold" style={{ color }}>{rt}</span>
            <span className="text-slate-600 text-xs truncate">{getTitle()}</span>
          </div>
        </div>
        <ChevronDown className={clsx('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-slate-100">
            <div className="p-4 font-mono text-xs text-slate-700 leading-relaxed overflow-x-auto max-h-80 overflow-y-auto" style={{ background: '#071a12' }}>
              <JsonNode data={entry.resource} depth={0} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FHIRBundleViewer({ bundle, index, onDownload, onCopy, validation }) {
  const [viewMode, setViewMode] = useState('resources');
  const entries = bundle.entry || [];
  const resourceTypes = [...new Set(entries.map(e => e.resource?.resourceType))];

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <div className="font-display font-semibold text-slate-800">Bundle #{index + 1}</div>
          <div className="text-slate-400 text-xs mt-0.5 font-mono">{bundle.id}</div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {resourceTypes.map(rt => <span key={rt} className="tag-blue text-xs font-mono">{rt}</span>)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-emerald-900">
            <button onClick={() => setViewMode('resources')} className={clsx('px-3 py-1.5 text-xs transition-colors', viewMode === 'resources' ? 'bg-emerald-900/20 text-emerald-400 font-medium' : 'text-slate-500 hover:text-slate-700')}>Resources</button>
            <button onClick={() => setViewMode('raw')} className={clsx('px-3 py-1.5 text-xs transition-colors border-l border-emerald-900', viewMode === 'raw' ? 'bg-emerald-900/20 text-emerald-400 font-medium' : 'text-slate-500 hover:text-slate-700')}>Raw JSON</button>
          </div>
          <button onClick={onCopy} className="btn-secondary text-xs flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" /> Copy</button>
          <button onClick={onDownload} className="btn-primary text-xs flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Download</button>
        </div>
      </div>

      {validation && (
        <div className="space-y-2">
          {validation.errors?.map((e, i) => <div key={i} className="flex items-center gap-2 text-xs text-red-600 p-2 rounded-lg bg-red-50 border border-red-200"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{e}</div>)}
          {validation.warnings?.map((w, i) => <div key={i} className="flex items-center gap-2 text-xs text-amber-600 p-2 rounded-lg bg-amber-50 border border-amber-200"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{w}</div>)}
          {validation.suggestions?.map((s, i) => <div key={i} className="flex items-center gap-2 text-xs text-emerald-400 p-2 rounded-lg bg-emerald-900/20 border border-sky-200"><CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />{s}</div>)}
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === 'resources' ? (
          <motion.div key="resources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {entries.map((entry, i) => <ResourceCard key={i} entry={entry} />)}
          </motion.div>
        ) : (
          <motion.div key="raw" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="p-4 rounded-xl font-mono text-xs text-slate-700 leading-relaxed overflow-auto max-h-[600px]"
              style={{ background: '#071a12', border: '1px solid #1a4a30' }}>
              <JsonNode data={bundle} depth={0} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
