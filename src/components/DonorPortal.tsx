'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { DonorStatus } from '@/types';
import { calculateCooldown } from '@/lib/compatibility';
import { soundManager } from '@/lib/audio';
import {
  HeartHandshake,
  ShieldCheck,
  Power,
  Clock,
  Droplet,
  BellRing,
  Sparkles,
  Calendar,
} from 'lucide-react';

export default function DonorPortal() {
  const {
    currentDonor,
    toggleDonorStatus,
    completeDonation,
    requests,
    acceptEmergencyRequest,
    openRelayModal,
    triggerSimulatedAlert,
  } = useApp();

  const [isOtpOpen, setIsOtpOpen] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('9876543210');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(true);

  const cooldownInfo = calculateCooldown(currentDonor.lastDonationDate);

  const handleStatusChange = (status: DonorStatus) => {
    toggleDonorStatus(currentDonor.id, status);
    if (status === 'AVAILABLE') {
      soundManager.playSuccessChime();
    } else {
      soundManager.playRadarPing();
    }
  };

  const handleCompleteDonationClick = () => {
    completeDonation(currentDonor.id);
  };

  const handleSendOtp = () => {
    setIsOtpSent(true);
    setOtpCode('849201');
    soundManager.playRadarPing();
  };

  const handleVerifyOtp = () => {
    setIsVerified(true);
    setIsOtpOpen(false);
    soundManager.playSuccessChime();
  };

  const relevantRequests = requests.filter(
    (r) => r.status === 'DISPATCHED' || r.status === 'ACTIVE'
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 border border-rose-500 p-6 shadow-lg shadow-rose-200 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-rose-100 text-xs font-semibold uppercase tracking-wider mb-1">
              <HeartHandshake className="w-4 h-4 text-white" />
              <span>Section 2A PRD Workflow</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Donor Cockpit & Availability</span>
              <span className="bg-white/20 text-white text-xs font-mono px-2 py-0.5 rounded-full border border-white/30">
                {currentDonor.maskedCode}
              </span>
            </h2>
            <p className="text-sm text-rose-100 mt-1">
              Manage live readiness, encrypted OTP verification, temporary masked outreach, and medical 90-day cooldown status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOtpOpen(true)}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/30 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{isVerified ? 'Phone OTP Verified' : 'Verify Phone'}</span>
            </button>

            <button
              onClick={triggerSimulatedAlert}
              className="bg-white hover:bg-rose-50 text-rose-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-900/20 transition-all"
            >
              <BellRing className="w-4 h-4 animate-bounce" />
              <span>Simulate Emergency Alert</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Availability Toggle & Cooldown Engine */}
        <div className="lg:col-span-7 space-y-6">
          {/* One-Tap Availability Toggle */}
          <div className="bg-white rounded-3xl border border-rose-100 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Power className="w-4 h-4 text-rose-600" />
                  <span>Real-Time Availability Toggle</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  One tap to instantly include or suppress yourself from automated emergency broadcasts.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`w-3 h-3 rounded-full ${
                    currentDonor.status === 'AVAILABLE'
                      ? 'bg-emerald-500 animate-ping'
                      : currentDonor.status === 'STANDBY'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="text-xs font-mono font-bold text-slate-700">
                  {currentDonor.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleStatusChange('AVAILABLE')}
                disabled={!cooldownInfo.isEligible}
                className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 relative ${
                  currentDonor.status === 'AVAILABLE'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200 text-emerald-950 font-bold'
                    : 'bg-white border-rose-100 text-slate-600 hover:border-rose-200'
                } ${!cooldownInfo.isEligible ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
                  <Droplet className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs">Active Dispatch</span>
                <span className="text-[10px] text-slate-500">Ready for calls</span>
              </button>

              <button
                onClick={() => handleStatusChange('STANDBY')}
                disabled={!cooldownInfo.isEligible}
                className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  currentDonor.status === 'STANDBY'
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-200 text-amber-950 font-bold'
                    : 'bg-white border-rose-100 text-slate-600 hover:border-rose-200'
                } ${!cooldownInfo.isEligible ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-1">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs">Standby</span>
                <span className="text-[10px] text-slate-500">Backup alert only</span>
              </button>

              <button
                onClick={() => handleStatusChange('OFFLINE')}
                className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  currentDonor.status === 'OFFLINE'
                    ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-200 text-slate-900 font-bold'
                    : 'bg-white border-rose-100 text-slate-600 hover:border-rose-200'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-1">
                  <Power className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs">Offline</span>
                <span className="text-[10px] text-slate-500">Notifications off</span>
              </button>
            </div>
          </div>

          {/* PRD Section 4: Auto-Cooldown Engine */}
          <div className="bg-white rounded-3xl border border-rose-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-600" />
                  <span>90-Day Auto-Cooldown Engine (12 Weeks)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated regulatory hold: Donors completing a donation are blocked for 90 days to protect donor biology.
                </p>
              </div>

              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  cooldownInfo.isEligible
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {cooldownInfo.isEligible ? 'Eligible to Donate' : 'Cooldown Enforced'}
              </span>
            </div>

            {/* Gauge / Progress */}
            <div className="bg-rose-50/40 rounded-2xl p-4 border border-rose-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Biological Recovery Progress:</span>
                <span className="font-mono font-bold text-slate-900">
                  {cooldownInfo.isEligible ? '100%' : `${cooldownInfo.progressPercent}% Complete`}
                </span>
              </div>

              <div className="w-full h-3 bg-rose-100 rounded-full overflow-hidden border border-rose-200">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    cooldownInfo.isEligible ? 'bg-emerald-500' : 'bg-rose-600'
                  }`}
                  style={{ width: `${cooldownInfo.progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>
                  {cooldownInfo.isEligible
                    ? 'No regulatory lock. Ready to save lives.'
                    : `${cooldownInfo.daysRemaining} days remaining in biological safety rest.`}
                </span>
                {cooldownInfo.cooldownDate && (
                  <span className="font-mono text-rose-700 font-bold">
                    Next: {new Date(cooldownInfo.cooldownDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Simulation Trigger Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Test the 90-day cooldown lock mechanism:
              </span>
              <button
                onClick={handleCompleteDonationClick}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Completed Donation</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Specs & Incoming Alerts Queue */}
        <div className="lg:col-span-5 space-y-6">
          {/* Donor Profile Telemetry Card */}
          <div className="bg-white rounded-3xl border border-rose-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Donor Profile Card
              </span>
              <span className="bg-rose-100 text-rose-800 text-[10px] font-mono px-2 py-0.5 rounded-full border border-rose-200 font-bold">
                Twilio Mask Active
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border-2 border-rose-400 flex items-center justify-center shadow-sm">
                <span className="text-2xl font-black text-rose-700">
                  {currentDonor.bloodType}
                </span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{currentDonor.name}</span>
                </h4>
                <div className="text-xs text-slate-500 font-mono mt-0.5 font-medium">
                  Masked Phone: {currentDonor.phoneMasked}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  📍 {currentDonor.city} • Pincode: {currentDonor.pincode}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-rose-50/50 p-2.5 rounded-2xl border border-rose-100">
                <span className="text-[10px] text-slate-500 block font-medium">Total Donations</span>
                <span className="font-bold text-base text-slate-800">
                  {currentDonor.totalDonations}
                </span>
              </div>
              <div className="bg-rose-50/50 p-2.5 rounded-2xl border border-rose-100">
                <span className="text-[10px] text-slate-500 block font-medium">Response Rate</span>
                <span className="font-bold text-base text-emerald-700">
                  {currentDonor.responseRate}%
                </span>
              </div>
              <div className="bg-rose-50/50 p-2.5 rounded-2xl border border-rose-100">
                <span className="text-[10px] text-slate-500 block font-medium">Avg Response</span>
                <span className="font-bold text-base text-rose-700">
                  ~{currentDonor.avgResponseTimeMins}m
                </span>
              </div>
            </div>
          </div>

          {/* Incoming Emergency Dispatch Alerts */}
          <div className="bg-white rounded-3xl border border-rose-100 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-rose-600" />
                <span>Live Emergency Requests</span>
              </h4>
              <span className="text-xs font-bold text-rose-700">
                {relevantRequests.length} Pending
              </span>
            </div>

            <div className="space-y-2.5">
              {relevantRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-rose-50/40 border border-rose-100 hover:border-rose-300 p-3.5 rounded-2xl transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{req.hospitalName}</span>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-rose-200">
                      {req.recipientBloodType} ({req.unitsRequired} Units)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{req.hospitalAddress}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-rose-700 font-mono font-bold">
                      🔴 Priority: {req.urgency}
                    </span>
                    <button
                      onClick={() => {
                        const chan = acceptEmergencyRequest(req.id, currentDonor.id);
                        openRelayModal(chan.id);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-3 py-1 rounded-lg flex items-center gap-1 transition-all shadow-sm"
                    >
                      <span>Accept & Open Relay</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal Simulator */}
      {isOtpOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">OTP Phone Verification</h3>
              </div>
              <button
                onClick={() => setIsOtpOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Verify donor phone number for secure cryptographic authentication. Your actual number is never shown to seekers or stored in public views.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Mobile Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 bg-rose-50/50 border border-rose-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white"
                  />
                  <button
                    onClick={handleSendOtp}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
                  >
                    Send OTP
                  </button>
                </div>
              </div>

              {isOtpSent && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-500 font-medium">Enter 6-Digit OTP</label>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">
                      Simulated Code: 849201
                    </span>
                  </div>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    placeholder="849201"
                    className="w-full bg-rose-50/60 border border-rose-300 rounded-xl px-3 py-2 text-center text-lg tracking-widest text-emerald-700 font-mono font-bold outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsOtpOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-800 px-4 py-2 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={!otpCode}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-all shadow-sm"
              >
                Verify & Authorize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
