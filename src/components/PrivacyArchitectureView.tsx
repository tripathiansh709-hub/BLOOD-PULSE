'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { soundManager } from '@/lib/audio';
import {
  ShieldCheck,
  Lock,
  PhoneForwarded,
  Clock,
  HeartHandshake,
  CheckCircle2,
  Server,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function PrivacyArchitectureView() {
  const { openRelayModal, activeRelayChannelId } = useApp();
  const [testSimulating, setTestSimulating] = useState<boolean>(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([
    'Twilio / Exotel Proxy Tunnel: Ready',
    'PostgreSQL PostGIS Geo-Hash: Tokenized (DX-4821)',
    'Direct Phone Number Encryption: AES-256 in Hardware Security Module',
  ]);

  const handleTestProxyRouting = () => {
    setTestSimulating(true);
    soundManager.playRadarPing();
    setTimeout(() => {
      setSimulationLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Seeker calls +91 800-RELAY-911 -> Virtual Mask forwards to Donor without revealing real MSISDN`,
        `[${new Date().toLocaleTimeString()}] Ephemeral bridge session established. Auto-expire in 23h 59m`,
        ...prev,
      ]);
      setTestSimulating(false);
      soundManager.playSuccessChime();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-700 via-rose-800 to-red-900 border border-rose-600 p-6 shadow-lg shadow-rose-200 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-rose-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Section 4 PRD Specification</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Privacy & Contact Protection Architecture
            </h2>
            <p className="text-sm text-rose-100 mt-1 max-w-2xl">
              Strict donor anonymity matrix eliminating harassment and spam through virtual proxy masking,
              24-hour self-destructing relay channels, and regulatory cooldown holds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => activeRelayChannelId && openRelayModal(activeRelayChannelId)}
              className="bg-white hover:bg-rose-50 text-rose-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-rose-700" />
              <span>Open Active Masked Bridge</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Privacy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            <PhoneForwarded className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">1. Virtual Proxy Masking</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Seekers and donors never exchange true cellular numbers. Communications route through virtual relay numbers (Twilio/Exotel) masking identity on all caller ID screens.
          </p>
          <div className="text-[11px] font-mono text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Zero Phone Leakage
          </div>
        </div>

        <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">2. 24-Hour Ephemeral Relay</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Temporary messaging and calling channels automatically expire after 24 hours or immediately upon donation confirmation, preventing persistent contact or subsequent harassment.
          </p>
          <div className="text-[11px] font-mono text-rose-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Auto Self-Destruct
          </div>
        </div>

        <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">3. 90-Day Safety Cooldown</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Donors who complete a whole blood or RBC donation are locked for 90 days (12 weeks) to comply with WHO/Red Cross medical safety guidelines and suppress incoming alerts.
          </p>
          <div className="text-[11px] font-mono text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Health Regulatory Hold
          </div>
        </div>
      </div>

      {/* Interactive Architecture Flow Diagram */}
      <div className="bg-white rounded-3xl border border-rose-100 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-rose-600" />
              <span>Interactive Data Flow & Masking Simulation</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualizing how requests pass through PostGIS spatial filtering and proxy telephony relays.
            </p>
          </div>

          <button
            onClick={handleTestProxyRouting}
            disabled={testSimulating}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{testSimulating ? 'Routing Test Call...' : 'Test Virtual Proxy Relay'}</span>
          </button>
        </div>

        {/* Diagram Flow Box */}
        <div className="p-6 bg-rose-50/50 rounded-2xl border border-rose-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center">
            {/* Step 1 */}
            <div className="bg-white border border-rose-200 p-4 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-slate-900">Seeker Hospital</div>
              <p className="text-[11px] text-slate-500 mt-1">App UI / Emergency OT</p>
              <div className="mt-2 text-[10px] font-mono bg-rose-50 px-2 py-0.5 rounded text-rose-700 font-bold">
                Sees: &quot;Donor DX-4821&quot;
              </div>
            </div>

            <div className="flex justify-center text-rose-500">
              <ArrowRight className="w-5 h-5 hidden md:block" />
              <span className="block md:hidden">↓</span>
            </div>

            {/* Step 2 */}
            <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-md shadow-rose-200">
              <div className="text-xs font-bold text-white">Twilio / Exotel Relay Gateway</div>
              <p className="text-[11px] text-rose-100 mt-1">Virtual Proxy Mask</p>
              <div className="mt-2 text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded text-white font-bold">
                +91 800-RELAY-108
              </div>
            </div>

            <div className="flex justify-center text-rose-500">
              <ArrowRight className="w-5 h-5 hidden md:block" />
              <span className="block md:hidden">↓</span>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-rose-200 p-4 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-slate-900">Registered Donor</div>
              <p className="text-[11px] text-slate-500 mt-1">Personal Device</p>
              <div className="mt-2 text-[10px] font-mono bg-rose-50 px-2 py-0.5 rounded text-emerald-700 font-bold">
                True Phone: +91 98••• ••210
              </div>
            </div>
          </div>
        </div>

        {/* Live Proxy Event Console */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-rose-900/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
              Relay Gateway Live Console Log
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">● 100% Encrypted</span>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-slate-300 max-h-32 overflow-y-auto">
            {simulationLog.map((log, index) => (
              <div key={index} className="text-slate-400">
                <span className="text-rose-400">&gt;</span> {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
