'use client';

import React from 'react';
import Link from 'next/link';
import HeroCarousel from '@/components/HeroCarousel';
import LearnAboutDonation from '@/components/LearnAboutDonation';
import RadarMap from '@/components/RadarMap';
import { useApp } from '@/lib/store';
import {
  Activity,
  HeartHandshake,
  ShieldCheck,
  Zap,
  Radio,
  Dna,
  ArrowRight,
  Clock,
} from 'lucide-react';

export default function HomePage() {
  const { donors } = useApp();

  const activeDonorsCount = donors.filter((d) => d.status === 'AVAILABLE' && d.isEligible).length;

  return (
    <div className="space-y-10">
      {/* 1. Hero Banner Carousel (From User Reference Image) */}
      <HeroCarousel />

      {/* 2. Live Emergency Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Verified Donors', val: `${activeDonorsCount} Ready`, icon: ShieldCheck, color: 'text-[#059669]', bg: 'bg-[#ECFDF5]', border: 'border-[#A7F3D0]' },
          { label: 'Avg Emergency Match', val: '< 4 Mins', icon: Clock, color: 'text-[#DC2626]', bg: 'bg-[#FFF1F2]', border: 'border-[#FECDD3]' },
          { label: 'Units Dispatched', val: '1,420+', icon: Activity, color: 'text-[#0D9488]', bg: 'bg-[#F0FDFA]', border: 'border-[#99F6E4]' },
          { label: 'Lives Impacted', val: '4,260+', icon: HeartHandshake, color: 'text-[#E11D48]', bg: 'bg-[#FFE4E6]', border: 'border-[#FDA4AF]' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-3xl border border-[#FFE4E6] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} border ${stat.border} shrink-0`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">{stat.val}</p>
              <p className="text-xs font-semibold text-[#64748B] mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Learn About Donation Section (Exact Graphic from User Reference Image) */}
      <LearnAboutDonation />

      {/* 4. Live Dispatch Radar Preview Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-[#DC2626] text-xs font-extrabold uppercase tracking-wider">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Real-Time PostGIS Proximity Engine</span>
            </div>
            <h3 className="text-2xl font-black text-[#0F172A] tracking-tight mt-0.5">
              Live Emergency Radar & Donor Dispatch
            </h3>
          </div>
          <Link
            href="/radar"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#DC2626] hover:text-[#9F1239] bg-white border border-[#FECDD3] px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all"
          >
            <span>Launch Fullscreen Radar</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Embedded Radar Component */}
        <RadarMap />
      </div>

      {/* 5. Navigation Gateways */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <Link
          href="/seeker"
          className="group bg-white rounded-3xl p-6 border border-[#FFE4E6] shadow-sm hover:shadow-md hover:border-[#DC2626]/40 transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center text-[#DC2626] group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-black text-[#0F172A] group-hover:text-[#DC2626] transition-colors">
              Emergency Seeker Dispatch
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Submit emergency recipient blood type, hospital coordinates, and prescription to automatically rank and notify nearby compatible donors.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#DC2626]">
            <span>Start Request Wizard</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/donor"
          className="group bg-white rounded-3xl p-6 border border-[#FFE4E6] shadow-sm hover:shadow-md hover:border-[#059669]/40 transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669] group-hover:scale-110 transition-transform">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-black text-[#0F172A] group-hover:text-[#059669] transition-colors">
              Donor Cockpit & Cooldown
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Manage your live availability toggle (Active/Standby/Offline), complete phone OTP verification, and track the 90-day medical recovery engine.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#059669]">
            <span>Access Donor Portal</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/compatibility"
          className="group bg-white rounded-3xl p-6 border border-[#FFE4E6] shadow-sm hover:shadow-md hover:border-[#0D9488]/40 transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] flex items-center justify-center text-[#0D9488] group-hover:scale-110 transition-transform">
              <Dna className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-black text-[#0F172A] group-hover:text-[#0D9488] transition-colors">
              Biological Compatibility Lab
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Interactive 8×8 whole blood & packed RBC compatibility matrix. Test biological donor-recipient pairings with immunological agglutination analysis.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D9488]">
            <span>Explore Compatibility Matrix</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
