'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { BloodGroup, UrgencyLevel, TransfusionMatchResult } from '@/types';
import { findMatchingDonors, RBC_COMPATIBILITY } from '@/lib/compatibility';
import { soundManager } from '@/lib/audio';
import {
  Zap,
  Hospital,
  Droplet,
  FileCheck2,
  Clock,
  ShieldAlert,
  Send,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
} from 'lucide-react';

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export default function SeekerWizard() {
  const {
    donors,
    hospitals,
    createEmergencyRequest,
    acceptEmergencyRequest,
    openRelayModal,
    setCurrentTab,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [recipientBloodType, setRecipientBloodType] = useState<BloodGroup>('B+');
  const [urgency, setUrgency] = useState<UrgencyLevel>('IMMEDIATE');
  const [unitsRequired, setUnitsRequired] = useState<number>(2);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(hospitals[0].id);
  const [patientName, setPatientName] = useState<string>('Rohan Sharma');
  const [patientId, setPatientId] = useState<string>('PT-88910');
  const [prescriptionUploaded, setPrescriptionUploaded] = useState<boolean>(true);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);

  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  // Live matching donors calculation
  const matches: TransfusionMatchResult[] = findMatchingDonors(
    recipientBloodType,
    selectedHospital.lat,
    selectedHospital.lng,
    urgency,
    donors,
    50
  );

  const handleNextStep = () => {
    if (step === 1) {
      soundManager.playRadarPing();
      setStep(2);
    } else if (step === 2) {
      // Create request in global state
      const newReq = createEmergencyRequest({
        patientName,
        patientId,
        recipientBloodType,
        hospitalName: selectedHospital.name,
        hospitalAddress: selectedHospital.address,
        hospitalLat: selectedHospital.lat,
        hospitalLng: selectedHospital.lng,
        urgency,
        unitsRequired,
        prescriptionVerified: prescriptionUploaded,
        prescriptionFileName: prescriptionUploaded ? 'Emergency_ICU_Prescription.pdf' : undefined,
        contactName: 'Hospital Emergency Desk',
        contactMaskedPhone: selectedHospital.emergencyPhoneMasked,
      });

      setCreatedRequestId(newReq.id);
      soundManager.playSuccessChime();
      setStep(3);
    }
  };

  const handleInitiateSecureContact = (donorId: string) => {
    if (!createdRequestId) return;
    const channel = acceptEmergencyRequest(createdRequestId, donorId);
    openRelayModal(channel.id);
  };

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 border border-rose-500 p-6 shadow-lg shadow-rose-200 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-rose-100 text-xs font-semibold uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4 text-white animate-bounce" />
              <span>Section 2B PRD Workflow</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Hospital & Seeker Emergency Dispatch
            </h2>
            <p className="text-sm text-rose-100 mt-1">
              Create high-urgency transfusion calls with automated biological filtering and masked contact outreach.
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 p-2 rounded-2xl">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                step >= 1 ? 'bg-white text-rose-700 shadow-sm' : 'bg-white/30 text-white'
              }`}
            >
              1
            </div>
            <div className={`w-6 h-0.5 ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                step >= 2 ? 'bg-white text-rose-700 shadow-sm' : 'bg-white/30 text-white'
              }`}
            >
              2
            </div>
            <div className={`w-6 h-0.5 ${step >= 3 ? 'bg-white' : 'bg-white/30'}`} />
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                step === 3 ? 'bg-white text-rose-700 shadow-sm' : 'bg-white/30 text-white'
              }`}
            >
              3
            </div>
          </div>
        </div>
      </div>

      {/* Main Wizard Form Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl border border-rose-100 p-6 shadow-sm space-y-6">
            {/* STEP 1: Urgency & Recipient Blood Group */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="border-b border-rose-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Step 1: Urgency Level & Recipient Blood Group
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select clinical urgency and required whole blood / packed RBC type.
                  </p>
                </div>

                {/* Urgency Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Clinical Urgency Level
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUrgency('IMMEDIATE')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                        urgency === 'IMMEDIATE'
                          ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-200'
                          : 'bg-white border-rose-100 hover:border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-rose-800 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                          Code Red: Immediate
                        </span>
                        <span className="bg-rose-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                          Priority 1
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Critical trauma, severe hemorrhaging, or emergency surgery. Dispatches multi-channel alerts within 5km radius.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUrgency('WITHIN_12_HOURS')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        urgency === 'WITHIN_12_HOURS'
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-200'
                          : 'bg-white border-rose-100 hover:border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-amber-800 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600" />
                          Within 12 Hours
                        </span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                          Scheduled
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Scheduled elective procedure, planned platelet/RBC replenishment, or stable surgical preparation.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Recipient Blood Group Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Patient Recipient Blood Group
                    </label>
                    <span className="text-xs text-rose-700 font-mono font-bold">
                      Accepts: {RBC_COMPATIBILITY[recipientBloodType].join(', ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {BLOOD_GROUPS.map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setRecipientBloodType(bg)}
                        className={`py-3 rounded-2xl font-bold text-base transition-all border-2 ${
                          recipientBloodType === bg
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200 scale-105 ring-2 ring-rose-200'
                            : 'bg-rose-50/60 text-rose-900 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Units Required */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Units Required (Whole Blood / RBC)
                    </label>
                    <span className="text-sm font-bold text-rose-600">{unitsRequired} Units</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={unitsRequired}
                    onChange={(e) => setUnitsRequired(Number(e.target.value))}
                    className="w-full h-2 bg-rose-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono font-medium">
                    <span>1 Unit (450ml)</span>
                    <span>2 Units</span>
                    <span>3 Units</span>
                    <span>4 Units</span>
                    <span>6 Units (Max Trauma)</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-md shadow-rose-200 transition-all"
                  >
                    <span>Proceed to Hospital Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Hospital Location & Prescription Upload */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="border-b border-rose-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Step 2: Hospital Verification & Prescription Upload
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Location coordinates are used to calculate PostGIS proximity rankings.
                  </p>
                </div>

                {/* Hospital Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Hospital Trauma Center
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hospitals.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setSelectedHospitalId(h.id)}
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                          selectedHospitalId === h.id
                            ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-200'
                            : 'bg-white border-rose-100 hover:border-rose-200'
                        }`}
                      >
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <Hospital className="w-4 h-4 text-rose-600" />
                          <span>{h.name}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{h.address}</p>
                        <span className="text-[10px] font-mono text-rose-700 mt-2 block font-semibold">
                          Masked Line: {h.emergencyPhoneMasked}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patient ID and Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Patient Full Name
                    </label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-rose-50/50 border border-rose-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-rose-500 outline-none"
                      placeholder="e.g. Rohan Sharma"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Verified Patient ID / MRN
                    </label>
                    <input
                      type="text"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="w-full bg-rose-50/50 border border-rose-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-rose-500 outline-none font-mono"
                      placeholder="e.g. PT-99482"
                    />
                  </div>
                </div>

                {/* Prescription Verification Upload Simulator */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Emergency Doctor Prescription / Requisition Slip
                  </label>
                  <div
                    onClick={() => setPrescriptionUploaded(!prescriptionUploaded)}
                    className="border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/40 rounded-2xl p-4 text-center cursor-pointer transition-colors"
                  >
                    {prescriptionUploaded ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-700 text-sm font-semibold">
                        <FileCheck2 className="w-5 h-5 text-emerald-600" />
                        <span>Prescription Verified: Emergency_ICU_Prescription.pdf (Signed by ICU Registrar)</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">
                        <span>Click to attach verified medical prescription (Simulated)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-500 hover:text-slate-800 text-xs font-semibold px-4 py-2"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-md shadow-rose-200 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Generate Matches & Broadcast Alert</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Automated Biological Match Results & Outreach */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="border-b border-rose-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <h3 className="text-lg font-bold text-slate-900">
                        Biological Match Results ({matches.length} Compatible Donors Found)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ranked by proximity (PostGIS ST_DWithin), biological suitability, and historical response rate.
                    </p>
                  </div>
                  <span className="bg-rose-100 text-rose-800 text-xs font-mono font-bold px-3 py-1 rounded-lg border border-rose-200">
                    Request ID: {createdRequestId}
                  </span>
                </div>

                {/* Ranked Matches List */}
                <div className="space-y-3">
                  {matches.length === 0 ? (
                    <div className="p-8 text-center bg-rose-50/50 rounded-2xl border border-rose-100">
                      <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-slate-900">No Donors Currently Online</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Broadcasting emergency notification to nearby standby donors...
                      </p>
                    </div>
                  ) : (
                    matches.map((match, idx) => (
                      <div
                        key={match.donor.id}
                        className="bg-white border-2 border-rose-100 hover:border-rose-300 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center font-bold text-rose-700 text-sm">
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm">
                                Donor {match.donor.maskedCode}
                              </h4>
                              <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-rose-200">
                                {match.donor.bloodType} RBC
                              </span>
                              <span className="text-[10px] text-emerald-700 font-mono font-bold">
                                {match.matchScore}% Match Score
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3 font-medium">
                              <span>📍 {match.distanceKm} km away</span>
                              <span>⚡ Response: {match.donor.responseRate}%</span>
                              <span>⏱️ ETA: ~{match.etaMinutes} mins</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleInitiateSecureContact(match.donor.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Connect via Masked Relay</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-rose-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                  >
                    Create Another Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('RADAR')}
                    className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    View on Live Radar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Match Summary & Safety Box */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Request Summary Box */}
          <div className="bg-white rounded-3xl border border-rose-100 p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-rose-600" />
              <span>Transfusion Summary</span>
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-rose-50">
                <span className="text-slate-500">Recipient Blood:</span>
                <span className="font-bold text-rose-700">{recipientBloodType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-rose-50">
                <span className="text-slate-500">Allowed Donor Types:</span>
                <span className="font-mono font-bold text-slate-800">
                  {RBC_COMPATIBILITY[recipientBloodType].join(', ')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-rose-50">
                <span className="text-slate-500">Units Needed:</span>
                <span className="font-bold text-slate-800">{unitsRequired} Units</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-rose-50">
                <span className="text-slate-500">Urgency:</span>
                <span className="font-bold text-rose-700">{urgency}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Destination:</span>
                <span className="text-slate-800 font-semibold truncate max-w-[150px]">
                  {selectedHospital.name}
                </span>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Box */}
          <div className="bg-white rounded-3xl border border-rose-100 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Confidentiality Guarantee
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Donors receive anonymous notifications. Your outreach goes through our Twilio-masked virtual proxy relay (+91 800-RELAY). Personal phone numbers are never stored in browser memory or exposed to public views.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
