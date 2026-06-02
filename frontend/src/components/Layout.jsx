import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wand2, Database, History, BookOpen,
  Activity, Menu, X, ChevronRight, Zap, Shield
} from 'lucide-react';
import { healthAPI } from '../services/api';
import clsx from 'clsx';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/convert', icon: Wand2, label: 'Converter' },
  { to: '/schema', icon: Database, label: 'Schema Explorer' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/docs', icon: BookOpen, label: 'API Docs' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [health, setHealth] = useState(null);
  const location = useLocation();

  useEffect(() => {
    healthAPI.check().then(r => setHealth(r.data)).catch(() => {});
  }, []);

  const llmCount = health ? Object.values(health.llmProviders || {}).filter(Boolean).length : 0;

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: '#071a12' }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="relative z-20 flex-shrink-0 flex flex-col h-full overflow-hidden"
            style={{ background: '#09201a', borderRight: '1px solid #1a4a30', boxShadow: '4px 0 24px rgba(0,0,0,0.5)' }}
          >
            {/* Logo */}
            <div className="px-6 py-5 border-b" style={{ borderColor: '#1a4a30' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-display font-bold text-lg text-white leading-tight">UniHealth</div>
                  <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#34d399' }}>FHIR TRANSFORMER</div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-5 space-y-1">
              {NAV.map(({ to, icon: Icon, label, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 group',
                    isActive ? 'text-white' : 'text-emerald-300/60 hover:text-white hover:bg-white/5'
                  )}
                  style={({ isActive }) => isActive ? {
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(13,148,136,0.15))',
                    border: '1px solid rgba(16,185,129,0.4)',
                    color: '#6ee7b7'
                  } : { border: '1px solid transparent' }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                  <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
                </NavLink>
              ))}
            </nav>

            {/* Status */}
            <div className="px-4 py-4 border-t" style={{ borderColor: '#1a4a30' }}>
              <div className="rounded-xl p-4" style={{ background: '#071a12', border: '1px solid #1a4a30' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-200">System Status</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={clsx('w-2.5 h-2.5 rounded-full', health ? 'bg-emerald-400' : 'bg-slate-600')}
                    style={health ? { boxShadow: '0 0 8px #34d399' } : {}} />
                  <span className="text-xs font-semibold text-white">{health ? 'Backend Online' : 'Connecting...'}</span>
                </div>
                {health && (
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-emerald-300/70">{llmCount} LLM{llmCount !== 1 ? 's' : ''} Active</span>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 py-4 flex-shrink-0"
          style={{ background: '#09201a', borderBottom: '1px solid #1a4a30', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
          <button onClick={() => setSidebarOpen(v => !v)}
            className="p-2 rounded-lg transition-all text-emerald-400 hover:text-white hover:bg-white/5">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xl" style={{ color: '#34d399' }}>UniHealth</span>
            <span style={{ color: '#1a4a30' }}>|</span>
            <span className="text-sm font-medium text-emerald-300/70">NHCX FHIR Transformer</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="tag-blue">ABDM Compliant</span>
            <span className="tag-green">NHCX v2.0</span>
            <span className="tag-orange">FHIR R4</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
