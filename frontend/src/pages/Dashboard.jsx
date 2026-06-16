import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wand2, FileSpreadsheet, Code2, MessageSquare, CheckCircle2,
  ArrowRight, Zap, Shield, Globe, Layers, Activity, TrendingUp, FileText
} from 'lucide-react';
import { healthAPI } from '../services/api';

const USE_CASES = [
  { id: 'coverage-eligibility', icon: Shield, title: 'Coverage Eligibility', description: 'Check patient insurance coverage and benefits in real-time via NHCX', color: '#38bdf8', border: 'rgba(56,189,248,0.3)', bg: 'rgba(56,189,248,0.08)', tag: 'CoverageEligibilityRequest' },
  { id: 'claim', icon: FileText, title: 'Claim Submission', description: 'Convert and submit institutional claims conforming to NHCX FHIR profiles', color: '#2563eb', border: 'rgba(37,99,235,0.3)', bg: 'rgba(37,99,235,0.08)', tag: 'Claim' },
  { id: 'preauth', icon: CheckCircle2, title: 'Pre-Authorization', description: 'Generate pre-auth request bundles for planned procedures and surgeries', color: '#f59e0b', border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.08)', tag: 'Claim (preauthorization)' },
  { id: 'communication', icon: MessageSquare, title: 'Communication', description: 'Bundle medical records, discharge summaries and documents for NHCX', color: '#14b8a6', border: 'rgba(20,184,166,0.3)', bg: 'rgba(20,184,166,0.08)', tag: 'Communication' },
];

const INPUT_FORMATS = [
  { icon: FileSpreadsheet, label: 'CSV / Excel', desc: 'Flat file exports from HMIS' },
  { icon: Code2, label: 'HL7 v2.x', desc: 'ADT, ORM, ORU messages' },
  { icon: Globe, label: 'XML / JSON', desc: 'Legacy API responses' },
  { icon: Wand2, label: 'Free Text', desc: 'AI-powered extraction' },
];

const STATS = [
  { label: 'FHIR Resources', value: '12+', color: '#38bdf8' },
  { label: 'SNOMED Codes', value: '50+', color: '#2563eb' },
  { label: 'Input Formats', value: '6', color: '#14b8a6' },
  { label: 'NHCX Profiles', value: '8', color: '#67e8f9' },
];

const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Dashboard() {
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    healthAPI.check().then(r => setHealth(r.data)).catch(() => {});
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">

      <motion.div variants={stagger} initial="initial" animate="animate">
        <motion.div variants={fadeUp} className="mb-4">
          <span className="tag-green tracking-widest uppercase text-xs">ABDM · NHCX · FHIR R4</span>
        </motion.div>

        <motion.h1 variants={fadeUp} className="font-display text-5xl font-bold text-white leading-tight mb-4">
          UniHealth — <span className="gradient-text">Legacy to FHIR</span>
        </motion.h1>

        <motion.p variants={fadeUp} className="text-slate-300 text-lg max-w-2xl font-body leading-relaxed">
          Transform HL7 v2.x, CSV, XML, and HMIS data into NHCX-aligned FHIR bundles
          with smart schema mapping and automatic SNOMED CT coding.
        </motion.p>

        <motion.div variants={fadeUp} className="flex items-center gap-4 mt-6">
          <button onClick={() => navigate('/convert')} className="btn-primary flex items-center gap-2 text-base px-6 py-3">
            <Wand2 className="w-4 h-4" /> Start Converting <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => navigate('/docs')} className="btn-secondary flex items-center gap-2 text-base px-6 py-3">
            API Documentation
          </button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-4 gap-4"
      >
        {STATS.map(s => (
          <div key={s.label} className="card text-center" style={{ borderColor: s.color + '40' }}>
            <div
              className="font-display text-4xl font-bold mb-2"
              style={{ color: s.color, textShadow: `0 0 20px ${s.color}60` }}
            >
              {s.value}
            </div>
            <div className="text-cyan-100/80 text-sm font-semibold">{s.label}</div>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center gap-3 mb-5">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h2 className="font-display text-2xl font-bold text-white">Supported Use Cases</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {USE_CASES.map((uc, i) => {
            const Icon = uc.icon;
            return (
              <motion.div
                key={uc.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                onClick={() => navigate(`/convert?useCase=${uc.id}`)}
                className="card cursor-pointer group transition-all duration-200"
                style={{ borderColor: uc.border, background: uc.bg }}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: uc.bg, border: `2px solid ${uc.border}` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: uc.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-white text-base mb-1">{uc.title}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{uc.description}</p>

                    <div className="mt-3">
                      <span
                        className="text-xs font-mono font-bold px-2 py-1 rounded-md"
                        style={{ color: uc.color, background: uc.bg, border: `1px solid ${uc.border}` }}
                      >
                        {uc.tag}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <div className="flex items-center gap-3 mb-5">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h2 className="font-display text-2xl font-bold text-white">Supported Input Formats</h2>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {INPUT_FORMATS.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              className="card text-center glass-hover"
            >
              <div
                className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'rgba(20,184,166,0.12)', border: '2px solid rgba(20,184,166,0.3)' }}
              >
                <Icon className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="font-display font-bold text-white text-sm mb-1">{label}</div>
              <div className="text-slate-400 text-xs">{desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {health && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="card">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display text-xl font-bold text-white">System Status</h2>

            <div className="ml-auto flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 10px #38bdf8' }} />
              <span className="text-sm text-cyan-400 font-bold">All Systems Operational</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {Object.entries(health.llmProviders || {}).map(([provider, active]) => (
              <div
                key={provider}
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: '#0f172a', border: `1px solid ${active ? 'rgba(56,189,248,0.35)' : '#334155'}` }}
              >
                <Zap className={`w-5 h-5 ${active ? 'text-cyan-400' : 'text-slate-600'}`} />
                <div>
                  <div className="text-white text-sm font-bold capitalize">{provider}</div>
                  <div className={`text-xs font-semibold ${active ? 'text-cyan-400' : 'text-slate-600'}`}>
                    {active ? '● Connected' : '○ Not configured'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}