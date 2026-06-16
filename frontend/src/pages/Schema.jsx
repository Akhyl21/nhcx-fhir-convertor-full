import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, ChevronDown, ChevronRight, Search, Shield } from 'lucide-react';
import { schemaAPI } from '../services/api';
import clsx from 'clsx';

export default function Schema() {
  const [schema, setSchema] = useState(null);
  const [snomed, setSnomed] = useState(null);
  const [tab, setTab] = useState('master');
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    schemaAPI.getMasterSchema().then(r => setSchema(r.data));
    schemaAPI.getSnomed().then(r => setSnomed(r.data));
  }, []);

  const toggleExpand = (key) => setExpanded(v => ({ ...v, [key]: !v[key] }));

  const filterSnomed = (entries) => {
    if (!search) return entries;
    return entries.filter(([k, v]) =>
      k.toLowerCase().includes(search.toLowerCase()) ||
      v.code?.includes(search) ||
      v.display?.toLowerCase().includes(search.toLowerCase())
    );
  };

  const TABS = [
    { id: 'master',   label: 'Master Schema' },
    { id: 'snomed',   label: 'SNOMED CT Mappings' },
    { id: 'profiles', label: 'NHCX Profiles' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Schema Explorer</h1>
        <p className="text-slate-300 text-base mt-1">Browse master field schemas and SNOMED CT mappings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: '#0d2518', border: '1px solid #1a4a30' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={tab === t.id
              ? { background: 'linear-gradient(135deg,rgba(6,182,212,0.25),rgba(59,130,246,0.2))', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.4)' }
              : { color: '#94a3b8', border: '1px solid transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'master' && schema && (
        <div className="space-y-3">
          {Object.entries(schema.masterSchema).map(([category, data]) => (
            <motion.div key={category} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="card overflow-hidden">
              <button onClick={() => toggleExpand(category)}
                className="w-full flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)' }}>
                  <Database className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="font-display font-bold text-white text-base capitalize">{category}</span>
                <span className="text-slate-400 text-sm ml-1">{Object.keys(data.fields || {}).length} fields</span>
                {data.required && (
                  <span className="tag-orange text-xs ml-auto mr-2">
                    required: {data.required.join(', ')}
                  </span>
                )}
                {expanded[category]
                  ? <ChevronDown className="w-5 h-5 text-cyan-400" />
                  : <ChevronRight className="w-5 h-5 text-slate-400" />}
              </button>
              {expanded[category] && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="mt-4 overflow-hidden">
                  <div className="space-y-2">
                    {Object.entries(data.fields || {}).map(([field, aliases]) => (
                      <div key={field} className="flex items-start gap-4 p-3 rounded-lg"
                        style={{ background: '#071a12', border: '1px solid #1a4a30' }}>
                        <span className="font-mono text-cyan-400 font-bold text-sm w-40 flex-shrink-0">{field}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {aliases.map(a => (
                            <span key={a} className="tag-blue text-xs font-mono">{a}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'snomed' && snomed && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input-field pl-10" placeholder="Search SNOMED codes, terms..." />
          </div>
          {Object.entries(snomed.snomedMappings).map(([category, entries]) => (
            <div key={category} className="card">
              <div className="font-display font-bold text-white text-lg mb-4 capitalize">{category} Mappings</div>
              <div className="space-y-2">
                {filterSnomed(Object.entries(entries)).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-4 p-3 rounded-lg text-sm"
                    style={{ background: '#071a12', border: '1px solid #1a4a30' }}>
                    <span className="font-mono text-cyan-400 font-bold w-28 flex-shrink-0">{key}</span>
                    <span className="font-mono text-emerald-400 font-bold w-24 flex-shrink-0">{val.code}</span>
                    <span className="text-slate-200 font-medium">{val.display}</span>
                    <span className="ml-auto text-slate-500 text-xs truncate max-w-xs">{val.system}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'profiles' && schema && (
        <div className="space-y-3">
          {Object.entries(schema.profiles).map(([name, url]) => (
            <div key={name} className="flex items-center gap-4 p-4 rounded-xl card">
              <Shield className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <span className="font-mono text-white font-bold text-sm">{name}</span>
              <span className="ml-auto font-mono text-slate-400 text-xs truncate max-w-lg">{url}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
