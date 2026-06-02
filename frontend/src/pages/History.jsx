// History.jsx
import React from 'react';
import { History as HistoryIcon, Clock, FileText } from 'lucide-react';

export function History() {
  const items = JSON.parse(localStorage.getItem('nhcx_history') || '[]');
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <HistoryIcon className="w-6 h-6 text-emerald-400" />
        <h1 className="font-display text-2xl font-bold text-white">Conversion History</h1>
      </div>
      {items.length === 0 ? (
        <div className="card text-center py-16">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No conversion history yet. Start converting files!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="card flex items-center gap-4">
              <FileText className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-white text-sm font-medium">{item.useCase}</div>
                <div className="text-slate-400 text-xs">{item.timestamp}</div>
              </div>
              <span className="ml-auto tag-green">{item.bundles} bundle(s)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;
