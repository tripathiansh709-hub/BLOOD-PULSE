'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { BloodGroup, Donor } from '@/types';
import { calculateDistanceKm, isBloodCompatible } from '@/lib/compatibility';
import { soundManager } from '@/lib/audio';
import {
  Radio,
  Hospital,
  ShieldCheck,
  Zap,
  Clock,
  Compass,
  ChevronRight,
  Users,
} from 'lucide-react';

export default function RadarMap() {
  const {
    donors,
    requests,
    hospitals,
    setCurrentTab,
  } = useApp();

  const [selectedBloodFilter, setSelectedBloodFilter] = useState<BloodGroup | 'ALL'>('ALL');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(hospitals[0].id);
  const [selectedDonorNode, setSelectedDonorNode] = useState<Donor | null>(null);
  const [radarRadiusKm, setRadarRadiusKm] = useState<number>(30);

  const activeHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  // Filter donors by radius and blood group
  const donorsWithDistance = donors.map((d) => {
    const dist = calculateDistanceKm(activeHospital.lat, activeHospital.lng, d.lat, d.lng);
    return {
      ...d,
      distanceKm: dist,
      isCompatible:
        selectedBloodFilter === 'ALL'
          ? true
          : isBloodCompatible(d.bloodType, selectedBloodFilter),
    };
  });

  const filteredDonors = donorsWithDistance.filter((d) => {
    if (d.distanceKm > radarRadiusKm) return false;
    if (selectedBloodFilter !== 'ALL' && !d.isCompatible) return false;
    return true;
  });

  const activeDonorsInRange = filteredDonors.filter(
    (d) => d.status === 'AVAILABLE' && d.isEligible
  ).length;

  // Conversion of GPS offset to radar coordinates (0 to 100 percentage)
  const getRadarCoordinates = (lat: number, lng: number) => {
    const latDiff = lat - activeHospital.lat;
    const lngDiff = lng - activeHospital.lng;

    const scale = 50 / (radarRadiusKm * 0.009);
    const x = 50 + lngDiff * scale;
    const y = 50 - latDiff * scale;

    return {
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(10, Math.min(90, y)),
    };
  };

  const handleDonorClick = (donor: Donor) => {
    setSelectedDonorNode(donor);
    soundManager.playRadarPing();
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-mono font-semibold">Radar Status</span>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
              <span>Scanning ({radarRadiusKm}km)</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-mono font-semibold">Donors In Reach</span>
            <div className="text-sm font-bold text-emerald-700">
              {activeDonorsInRange} Verified Ready
            </div>
          </div>
        </div>

        <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <Hospital className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-mono font-semibold">Hospital Center</span>
            <div className="text-sm font-bold text-slate-800 truncate max-w-[140px]">
              {activeHospital.name}
            </div>
          </div>
        </div>

        <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-mono font-semibold">Average ETA</span>
            <div className="text-sm font-bold text-rose-700">~6 to 14 mins</div>
          </div>
        </div>
      </div>

      {/* Main Radar Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Map Canvas */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-rose-200/80 p-6 shadow-md relative overflow-hidden flex flex-col items-center">
          {/* Controls Bar Above Radar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 z-20">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-mono font-semibold flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-rose-600" /> Center:
              </span>
              <select
                aria-label="Select Hospital Center"
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                className="bg-rose-50/70 border border-rose-200 text-xs font-medium text-slate-800 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-rose-500 outline-none shadow-sm"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Radius Switcher & Blood Filter */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500 font-mono">Radius:</span>
                {[15, 30, 50].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadarRadiusKm(r)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      radarRadiusKm === r
                        ? 'bg-rose-600 text-white font-bold shadow-sm'
                        : 'bg-rose-50 text-slate-600 hover:bg-rose-100 border border-rose-100'
                    }`}
                  >
                    {r}km
                  </button>
                ))}
              </div>

              {/* Blood Type Quick Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-xs text-slate-500 font-mono">Match:</span>
                <button
                  onClick={() => setSelectedBloodFilter('ALL')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    selectedBloodFilter === 'ALL'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-rose-50 text-slate-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  ALL
                </button>
                {(['O-', 'O+', 'A+', 'B+'] as BloodGroup[]).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setSelectedBloodFilter(bg)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      selectedBloodFilter === bg
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-rose-50 text-slate-700 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Radar Circular Visual Canvas */}
          <div className="relative w-full aspect-square max-w-[500px] rounded-full border-2 border-rose-200 bg-gradient-to-b from-[#FFF5F6] via-white to-[#FFF0F2] flex items-center justify-center overflow-hidden shadow-inner">
            {/* Concentric Distance Rings */}
            <div className="absolute inset-4 rounded-full border border-rose-200/60 pointer-events-none" />
            <div className="absolute inset-16 rounded-full border border-rose-200 pointer-events-none">
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-rose-500 font-bold bg-white/80 px-1 rounded">
                15 KM
              </span>
            </div>
            <div className="absolute inset-32 rounded-full border border-rose-300 pointer-events-none">
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-rose-600 font-bold bg-white/80 px-1 rounded">
                5 KM (Immediate)
              </span>
            </div>

            {/* Crosshair Lines */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-rose-200/80" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-full w-[1px] bg-rose-200/80" />
            </div>

            {/* Radar Sweeping Beam (CSS Spin) */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none origin-center"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgba(244, 63, 94, 0.05) 330deg, rgba(225, 29, 72, 0.22) 360deg)',
                animation: 'spin 4s linear infinite',
              }}
            />

            {/* Center Hospital Beacon */}
            <div className="absolute z-20 flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-rose-500 opacity-60" />
                <div className="relative w-9 h-9 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center shadow-lg shadow-rose-300">
                  <Hospital className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="bg-white/95 border border-rose-200 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 shadow-sm whitespace-nowrap">
                {activeHospital.name.split(' ')[0]} Hub
              </span>
            </div>

            {/* Nearby Donor Blips */}
            {filteredDonors.map((donor) => {
              const { x, y } = getRadarCoordinates(donor.lat, donor.lng);
              const isSelected = selectedDonorNode?.id === donor.id;
              const isAvailable = donor.status === 'AVAILABLE' && donor.isEligible;
              const isCooldown = !donor.isEligible;

              return (
                <button
                  key={donor.id}
                  onClick={() => handleDonorClick(donor)}
                  style={{ top: `${y}%`, left: `${x}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 group transition-transform ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    {isAvailable && (
                      <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-emerald-400 opacity-60" />
                    )}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border-2 font-bold text-[10px] shadow-md transition-all ${
                        isSelected
                          ? 'ring-2 ring-rose-600 scale-110'
                          : ''
                      } ${
                        isCooldown
                          ? 'bg-slate-200 border-slate-300 text-slate-500'
                          : isAvailable
                          ? 'bg-emerald-600 border-white text-white shadow-emerald-200'
                          : 'bg-amber-500 border-white text-white'
                      }`}
                    >
                      {donor.bloodType}
                    </div>
                  </div>

                  {/* Donor Tooltip Label on Hover / Selected */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-1 left-1/2 -translate-x-1/2 pointer-events-none bg-slate-900 text-white px-2 py-1 rounded-md text-[10px] whitespace-nowrap shadow-xl z-30">
                    <div className="font-bold text-rose-300">{donor.maskedCode}</div>
                    <div className="text-slate-300">
                      {donor.distanceKm} km • {donor.bloodType}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Radar Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs z-20">
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block border border-white" />
              Hospital Center
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Available Donor
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              On Standby
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
              In 90-Day Cooldown
            </span>
          </div>
        </div>

        {/* Right Column: Node Inspector & Active Dispatches */}
        <div className="lg:col-span-4 space-y-6">
          {/* Selected Donor Card */}
          {selectedDonorNode ? (
            <div className="bg-white rounded-3xl border border-rose-200/90 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-rose-700 uppercase tracking-wider font-bold">
                  Donor Inspector
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    selectedDonorNode.status === 'AVAILABLE' && selectedDonorNode.isEligible
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {selectedDonorNode.status}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border-2 border-rose-400 flex items-center justify-center">
                  <span className="text-xl font-black text-rose-700">
                    {selectedDonorNode.bloodType}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    Donor {selectedDonorNode.maskedCode}
                  </h4>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>OTP Verified • Contact Masked</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                  <span className="text-slate-500 text-[10px] block font-medium">Distance</span>
                  <span className="font-bold text-slate-800">
                    {calculateDistanceKm(
                      activeHospital.lat,
                      activeHospital.lng,
                      selectedDonorNode.lat,
                      selectedDonorNode.lng
                    )}{' '}
                    km away
                  </span>
                </div>
                <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                  <span className="text-slate-500 text-[10px] block font-medium">Response Rate</span>
                  <span className="font-bold text-emerald-700">
                    {selectedDonorNode.responseRate}% (~{selectedDonorNode.avgResponseTimeMins}m)
                  </span>
                </div>
              </div>

              {!selectedDonorNode.isEligible && (
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-800">
                  ⚠️ Currently in 90-day post-donation cooldown. Next eligible:{' '}
                  {new Date(selectedDonorNode.cooldownUntil || '').toLocaleDateString()}
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setCurrentTab('SEEKER');
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-200 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  <span>Request Emergency Transfusion</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-rose-100 p-6 text-center shadow-sm">
              <Compass className="w-8 h-8 text-rose-400 mx-auto mb-2 animate-spin" style={{ animationDuration: '8s' }} />
              <h4 className="text-sm font-bold text-slate-800">Radar Node Inspector</h4>
              <p className="text-xs text-slate-500 mt-1">
                Click any blip on the radar canvas to view masked proximity details and response metrics.
              </p>
            </div>
          )}

          {/* Active Emergency Transfusion Dispatches */}
          <div className="bg-white rounded-3xl border border-rose-100 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                <span>Live Emergency Beacons</span>
              </h4>
              <span className="text-xs font-bold text-rose-700">{requests.length} Active</span>
            </div>

            <div className="space-y-2.5">
              {requests.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  className="bg-rose-50/40 border border-rose-100 hover:border-rose-300 p-3 rounded-2xl transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-rose-700 font-bold">
                      {req.id} • {req.urgency}
                    </span>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-rose-200">
                      {req.recipientBloodType} ({req.unitsRequired} Units)
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate">{req.hospitalName}</div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>Patient: {req.patientName}</span>
                    <span className="text-emerald-700 font-semibold">{req.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setCurrentTab('SEEKER')}
              className="w-full text-center text-xs text-rose-600 hover:text-rose-800 font-bold py-1.5 flex items-center justify-center gap-1"
            >
              <span>Create New Emergency Request</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
