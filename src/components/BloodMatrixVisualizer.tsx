'use client';

import React, { useState } from 'react';
import { BloodGroup } from '@/types';
import {
  RBC_COMPATIBILITY,
  RBC_CAN_DONATE_TO,
  BLOOD_GROUP_INFO,
  isBloodCompatible,
} from '@/lib/compatibility';
import { soundManager } from '@/lib/audio';
import {
  Dna,
  ShieldCheck,
  AlertTriangle,
  Droplet,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export default function BloodMatrixVisualizer() {
  const [selectedRecipient, setSelectedRecipient] = useState<BloodGroup>('B+');
  const [selectedDonor, setSelectedDonor] = useState<BloodGroup>('O-');

  const compatible = isBloodCompatible(selectedDonor, selectedRecipient);
  const compatibleDonors = RBC_COMPATIBILITY[selectedRecipient];
  const canDonateRecipients = RBC_CAN_DONATE_TO[selectedDonor];

  const recipientInfo = BLOOD_GROUP_INFO[selectedRecipient];
  const donorInfo = BLOOD_GROUP_INFO[selectedDonor];

  const handleSelectDonor = (bg: BloodGroup) => {
    setSelectedDonor(bg);
    if (isBloodCompatible(bg, selectedRecipient)) {
      soundManager.playSuccessChime();
    } else {
      soundManager.playEmergencyAlert();
    }
  };

  const handleSelectRecipient = (bg: BloodGroup) => {
    setSelectedRecipient(bg);
    if (isBloodCompatible(selectedDonor, bg)) {
      soundManager.playSuccessChime();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 border border-rose-500 p-6 shadow-lg shadow-rose-200 text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-rose-100 text-xs font-semibold uppercase tracking-wider mb-1">
              <Dna className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '6s' }} />
              <span>Section 3 PRD Specification</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Biological Blood Compatibility Matrix
            </h2>
            <p className="text-sm text-rose-100 mt-1 max-w-2xl">
              Real-time immunological crossmatch engine adhering strictly to medical Whole Blood and
              Packed Red Blood Cells (RBC) transfusion rules.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 p-2.5 rounded-2xl">
            <div className="text-center px-3 border-r border-white/20">
              <span className="block text-[11px] text-rose-100 font-medium">Universal Donor</span>
              <span className="text-lg font-black text-white">O−</span>
            </div>
            <div className="text-center px-3">
              <span className="block text-[11px] text-rose-100 font-medium">Universal Recipient</span>
              <span className="text-lg font-black text-white">AB+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Transfusion Simulator Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Pair Tester */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-rose-100 p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Interactive Crossmatch Lab</span>
              <span className="text-xs font-medium text-slate-500">
                Click donor & recipient to test transfusion compatibility
              </span>
            </h3>

            {/* Donor Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-rose-600" />
                  <span>1. Prospective Donor Blood Type</span>
                </label>
                <span className="text-xs text-slate-500">
                  {donorInfo.isUniversalDonor && (
                    <span className="text-emerald-700 font-bold">Universal RBC Donor</span>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {BLOOD_GROUPS.map((bg) => {
                  const isSelected = selectedDonor === bg;
                  return (
                    <button
                      key={`donor-${bg}`}
                      onClick={() => handleSelectDonor(bg)}
                      className={`relative py-3 rounded-2xl font-bold text-sm transition-all duration-200 border-2 flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200 scale-105 ring-2 ring-rose-200'
                          : 'bg-rose-50/60 text-rose-950 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      <span className="text-base">{bg}</span>
                      <span className="text-[9px] font-normal opacity-80">
                        {BLOOD_GROUP_INFO[bg].rarityPercent}% pop
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visual Transfusion Pipe Animation */}
            <div className="relative py-4 px-6 bg-rose-50/50 rounded-2xl border border-rose-200/80 overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium">Donor</div>
                  <div className="w-14 h-14 rounded-2xl bg-white border-2 border-rose-500 flex items-center justify-center mx-auto shadow-sm">
                    <span className="text-xl font-black text-rose-700">{selectedDonor}</span>
                  </div>
                </div>

                {/* Animated Connecting Flow */}
                <div className="flex-1 px-4 flex flex-col items-center">
                  <div className="w-full relative h-3 bg-rose-200/60 rounded-full overflow-hidden border border-rose-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        compatible
                          ? 'bg-gradient-to-r from-rose-500 via-emerald-400 to-emerald-500 animate-pulse'
                          : 'bg-gradient-to-r from-rose-400 via-red-600 to-rose-700'
                      }`}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-bold">
                    {compatible ? (
                      <span className="text-emerald-700 flex items-center gap-1 animate-pulse">
                        <CheckCircle2 className="w-4 h-4" /> COMPATIBLE TRANSFUSION
                      </span>
                    ) : (
                      <span className="text-rose-700 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> AGGLUTINATION RISK
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium">Recipient</div>
                  <div className="w-14 h-14 rounded-2xl bg-white border-2 border-rose-700 flex items-center justify-center mx-auto shadow-sm">
                    <span className="text-xl font-black text-rose-900">{selectedRecipient}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipient Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-rose-600" />
                  <span>2. Patient / Recipient Blood Type</span>
                </label>
                <span className="text-xs text-slate-500">
                  {recipientInfo.isUniversalRecipient && (
                    <span className="text-cyan-700 font-bold">Universal Recipient</span>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {BLOOD_GROUPS.map((bg) => {
                  const isSelected = selectedRecipient === bg;
                  return (
                    <button
                      key={`recipient-${bg}`}
                      onClick={() => handleSelectRecipient(bg)}
                      className={`relative py-3 rounded-2xl font-bold text-sm transition-all duration-200 border-2 flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-rose-700 text-white border-rose-700 shadow-md shadow-rose-200 scale-105 ring-2 ring-rose-200'
                          : 'bg-rose-50/60 text-rose-950 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      <span className="text-base">{bg}</span>
                      <span className="text-[9px] font-normal opacity-80">
                        {BLOOD_GROUP_INFO[bg].rarityPercent}% pop
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Medical Result Alert Card */}
            <div
              className={`rounded-2xl p-4 border-2 transition-all ${
                compatible
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50/70 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {compatible ? (
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-700 mt-0.5">
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {compatible
                      ? `SAFE TRANSFUSION: ${selectedDonor} → ${selectedRecipient}`
                      : `LETHAL INCOMPATIBILITY: ${selectedDonor} cannot give to ${selectedRecipient}`}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {compatible
                      ? `Donor ${selectedDonor} red cells lack foreign antigens that would trigger recipient ${selectedRecipient}'s antibodies. Safe for whole blood or packed RBC transfusion.`
                      : `Patient ${selectedRecipient} has antibodies against antigens present on ${selectedDonor} red blood cells. Transfusion would trigger acute hemolytic reaction, clotting, and renal failure.`}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-rose-200 font-mono shadow-sm">
                      Recipient Antibodies: <strong>{recipientInfo.antibodies}</strong>
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-rose-200 font-mono shadow-sm">
                      Donor Antigens: <strong>{donorInfo.antigens}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Breakdown Cards */}
        <div className="lg:col-span-5 space-y-6">
          {/* Who can receive from selected donor */}
          <div className="bg-white rounded-3xl border border-rose-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span>Donor {selectedDonor} Can Give Red Cells To:</span>
              </h4>
              <span className="text-xs font-bold text-rose-700">
                {canDonateRecipients.length} / 8 Types
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((bg) => {
                const canGive = canDonateRecipients.includes(bg);
                return (
                  <div
                    key={`give-${bg}`}
                    className={`py-2 px-2 rounded-xl text-center font-bold text-xs border-2 ${
                      canGive
                        ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                    }`}
                  >
                    {bg}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
              {donorInfo.description}
            </p>
          </div>

          {/* Who can donate to selected recipient */}
          <div className="bg-white rounded-3xl border border-rose-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-800" />
                <span>Patient {selectedRecipient} Can Receive From:</span>
              </h4>
              <span className="text-xs font-bold text-rose-800">
                {compatibleDonors.length} / 8 Types
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((bg) => {
                const canReceive = compatibleDonors.includes(bg);
                return (
                  <div
                    key={`receive-${bg}`}
                    className={`py-2 px-2 rounded-xl text-center font-bold text-xs border-2 ${
                      canReceive
                        ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                    }`}
                  >
                    {bg}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
              {recipientInfo.description}
            </p>
          </div>
        </div>
      </div>

      {/* Comprehensive 8x8 Medical Reference Table */}
      <div className="bg-white rounded-3xl border border-rose-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Complete RBC Transfusion Compatibility Matrix (8×8)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Horizontal: Recipient Blood Type • Vertical: Donor Blood Type
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Compatible (✓)
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-full bg-slate-200 inline-block border border-slate-300" /> Incompatible
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr>
                <th className="p-2.5 text-xs font-bold text-rose-900 uppercase bg-rose-50 border border-rose-200 text-left">
                  Recipient → <br />
                  <span className="text-[10px] text-slate-500">Donor ↓</span>
                </th>
                {BLOOD_GROUPS.map((rec) => (
                  <th
                    key={`th-${rec}`}
                    className={`p-2.5 text-xs font-bold border border-rose-200 ${
                      selectedRecipient === rec
                        ? 'bg-rose-200/80 text-rose-950 font-extrabold'
                        : 'bg-rose-50/70 text-slate-800'
                    }`}
                  >
                    {rec}
                    {rec === 'AB+' && (
                      <span className="block text-[8px] text-emerald-700 font-normal">Univ Rec</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLOOD_GROUPS.map((donor) => {
                const isCurrentDonor = selectedDonor === donor;
                return (
                  <tr key={`tr-${donor}`} className="border-b border-rose-100">
                    <td
                      className={`p-2.5 text-xs font-bold border border-rose-200 text-left ${
                        isCurrentDonor
                          ? 'bg-rose-200/80 text-rose-950 font-extrabold'
                          : 'bg-rose-50/50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{donor}</span>
                        {donor === 'O-' && (
                          <span className="text-[9px] bg-rose-600 text-white px-1 py-0.2 rounded font-bold">
                            Univ
                          </span>
                        )}
                      </div>
                    </td>

                    {BLOOD_GROUPS.map((recipient) => {
                      const isMatch = isBloodCompatible(donor, recipient);
                      const isHighlighted =
                        selectedDonor === donor && selectedRecipient === recipient;

                      return (
                        <td
                          key={`cell-${donor}-${recipient}`}
                          onClick={() => {
                            setSelectedDonor(donor);
                            setSelectedRecipient(recipient);
                          }}
                          className={`p-2.5 text-xs font-bold border border-rose-100 transition-colors cursor-pointer ${
                            isHighlighted
                              ? isMatch
                                ? 'bg-emerald-600 text-white shadow-inner scale-95'
                                : 'bg-rose-600 text-white shadow-inner scale-95'
                              : isMatch
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-white text-slate-300 hover:bg-rose-50'
                          }`}
                        >
                          {isMatch ? '✓' : '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
