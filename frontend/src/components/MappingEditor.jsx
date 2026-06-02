import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, AlertCircle, CheckCircle2, RefreshCw, Wand2 } from 'lucide-react';
import { convertAPI } from '../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const ALL_TARGET_FIELDS = [
  { group: 'Patient', fields: ['patientId','patientName','gender','dob','age','phone','email','address','city','state','pincode','abhaId','aadhar'] },
  { group: 'Insurance', fields: ['policyNumber','insurerName','insurerId','memberId','sumInsured','policyStartDate','policyEndDate','relationship','policyType'] },
  { group: 'Hospital', fields: ['hospitalName','hospitalId','rohiniId','gstin','hospitalAddress'] },
  { group: 'Claim', fields: ['claimId','claimDate','claimType','claimedAmount','admissionDate','dischargeDate','hospitalizationType','priority'] },
  { group: 'Diagnosis', fields: ['icdCode','diagnosisName','onsetDate'] },
  { group: 'Procedure', fields: ['procedureCode','procedureName','performedDate'] },
];

const flatTargetFields = ALL_TARGET_FIELDS.flatMap(g => g.fields);

export default function MappingEditor({ headers, sampleRows, mapping, masterSchema, onChange }) {
  const [reInferring, setReInferring] = useState(false);

  const mappedCount = Object.values(mapping).filter(Boolean).length;
  const unmappedHeaders = headers.filter(h => !mapping[h]);

  const setFieldMapping = (header, target) => {
    onChange({ ...mapping, [header]: target || null });
  };

  const reInfer = async () => {
    setReInferring(true);
    try {
      const res = await convertAPI.inferMapping(headers, sampleRows?.[0]);
      onChange(res.data.mapping);
      toast.success('Mapping updated by AI');
    } catch {
      toast.error('Re-inference failed');
    } finally {
      setReInferring(false);
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display font-semibold text-white">Field Mapping</div>
          <div className="text-slate-400 text-xs mt-0.5">
            Map source columns → FHIR target fields. AI has pre-filled most.
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-400">{mappedCount} mapped</span>
          </div>
          {unmappedHeaders.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-xs text-slate-400">{unmappedHeaders.length} unmapped</span>
            </div>
          )}
          <button onClick={reInfer} disabled={reInferring} className="btn-secondary text-xs flex items-center gap-1.5">
            {reInferring ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            Re-infer with AI
          </button>
        </div>
      </div>

      {/* Sample data preview */}
      {sampleRows?.length > 0 && (
        <div className="rounded-xl overflow-auto max-h-36"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(26,74,48,0.4)' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'rgba(16,185,129,0.08)', borderBottom: '1px solid rgba(26,74,48,0.5)' }}>
                {headers.map(h => (
                  <th key={h} className="px-3 py-2 text-left font-mono text-emerald-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleRows.slice(0, 2).map((row, ri) => (
                <tr key={ri} className="border-b border-slate-800/50">
                  {headers.map(h => (
                    <td key={h} className="px-3 py-1.5 text-slate-400 whitespace-nowrap max-w-[120px] truncate">{row[h] || '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mapping rows */}
      <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
        {headers.map(header => {
          const target = mapping[header];
          const isMapped = !!target;
          return (
            <div key={header} className={clsx(
              'flex items-center gap-3 p-2.5 rounded-xl transition-colors',
              isMapped ? 'bg-emerald-400/5 border border-emerald-400/15' : 'bg-slate-800/20 border border-slate-700/30'
            )}>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs text-slate-300 truncate">{header}</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <select
                  value={target || ''}
                  onChange={e => setFieldMapping(header, e.target.value)}
                  className="w-full text-xs rounded-lg px-2.5 py-1.5 outline-none transition-all"
                  style={{
                    background: 'rgba(7,26,18,0.8)',
                    border: isMapped ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(26,74,48,0.5)',
                    color: isMapped ? '#34d399' : '#64748b',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                  <option value="">— skip —</option>
                  {ALL_TARGET_FIELDS.map(grp => (
                    <optgroup key={grp.group} label={grp.group}>
                      {grp.fields.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              {isMapped
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 text-slate-600 flex-shrink-0" />
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
