'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { soundManager } from '@/lib/audio';
import {
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function EmergencyAlertNotification() {
  const {
    activeAlert,
    dismissAlert,
    acceptEmergencyRequest,
    openRelayModal,
    currentDonor,
  } = useApp();

  if (!activeAlert) return null;

  const handleAccept = () => {
    const channel = acceptEmergencyRequest(activeAlert.requestId, currentDonor.id);
    dismissAlert();
    openRelayModal(channel.id);
    soundManager.playSuccessChime();
  };

  const handleDismiss = () => {
    dismissAlert();
  };

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="relative rounded-3xl bg-white border-2 border-rose-500 p-5 shadow-2xl shadow-rose-200 text-slate-900 overflow-hidden ring-4 ring-rose-100">
        <div className="relative z-10 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              <span className="text-xs font-mono font-bold tracking-wider text-rose-700 uppercase">
                CRITICAL TRANSFUSION MATCH ALERT
              </span>
            </div>

            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border-2 border-rose-500 flex items-center justify-center font-black text-xl text-rose-700 shadow-sm">
              {activeAlert.bloodType}
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">{activeAlert.hospitalName}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{activeAlert.hospitalAddress}</p>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-rose-700 font-bold">
                <span>📍 {activeAlert.distanceKm} km away</span>
                <span>•</span>
                <span>🩸 {activeAlert.unitsRequired} Units Required</span>
              </div>
            </div>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 p-2.5 rounded-2xl text-[11px] text-slate-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Virtual Relay Active. Hospital will connect with you via masked proxy.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleDismiss}
              className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-rose-200 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept & Open Masked Bridge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
