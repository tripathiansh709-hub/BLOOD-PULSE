'use client';

import React from 'react';
import Link from 'next/link';
import {
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-700 to-red-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-rose-200/50 space-y-4">
        <span className="text-xs font-mono font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
          About BloodPulse
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          One Platform. One Mission. <br />
          <span className="text-amber-300">Saving More Lives Every Minute.</span>
        </h1>
        <p className="text-base text-rose-100 max-w-2xl leading-relaxed">
          The Dynamic Emergency Blood Matcher is a clinical-grade real-time emergency directory connecting patients requiring urgent blood transfusions with registered nearby donors.
        </p>
      </div>

      {/* The Merger Story (From User Reference Image) */}
      <div className="bg-white rounded-3xl border border-rose-100 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-red-600 rounded-2xl border border-rose-200">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              The BloodWorld & BloodDonor Alliance
            </h2>
            <p className="text-xs text-slate-500">Unifying voluntary donor registries under one real-time protocol</p>
          </div>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          Previously, patients and trauma hospitals had to navigate fragmented networks, phone directories, and unverified social media requests. By merging these platforms into one unified real-time dispatch engine, requests are instantly crossmatched against verified donors with spatial proximity scoring and automated biological transfusion rules.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-[#FFF1F2] border border-[#FECDD3] p-4 rounded-2xl text-center">
            <span className="text-2xl font-black text-[#DC2626]">100%</span>
            <span className="block text-xs font-bold text-slate-700 mt-1">Verified Registries</span>
          </div>
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-4 rounded-2xl text-center">
            <span className="text-2xl font-black text-[#059669]">Zero Leakage</span>
            <span className="block text-xs font-bold text-slate-700 mt-1">Masked Twilio Calls</span>
          </div>
          <div className="bg-[#F0FDFA] border border-[#99F6E4] p-4 rounded-2xl text-center">
            <span className="text-2xl font-black text-[#0D9488]">90-Day Hold</span>
            <span className="block text-xs font-bold text-slate-700 mt-1">Biological Safety Rest</span>
          </div>
        </div>
      </div>

      {/* FAQ & Transfusion Standards */}
      <div className="bg-white rounded-3xl border border-rose-100 p-8 shadow-sm space-y-6">
        <h3 className="text-xl font-black text-slate-900">
          Medical & Operational FAQ
        </h3>

        <div className="space-y-4 text-xs sm:text-sm">
          <div className="border border-rose-100 rounded-2xl p-4 space-y-1">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-red-600" />
              How does the automated biological matching work?
            </h4>
            <p className="text-slate-600 leading-relaxed pl-6">
              Matching strictly adheres to Whole Blood and Packed Red Blood Cells (RBC) transfusion rules. For example, patient with B+ receives only from O-, O+, B-, and B+. Universal donor O- is prioritized for trauma code red cases.
            </p>
          </div>

          <div className="border border-rose-100 rounded-2xl p-4 space-y-1">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-red-600" />
              How are donor phone numbers protected from spam and harassment?
            </h4>
            <p className="text-slate-600 leading-relaxed pl-6">
              Direct cell phone numbers are never stored in client code or displayed on UI views. Communications route through virtual proxy masking (e.g. Twilio/Exotel) and temporary 24-hour chat bridges that self-destruct upon fulfillment.
            </p>
          </div>

          <div className="border border-rose-100 rounded-2xl p-4 space-y-1">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-red-600" />
              What is the 90-Day Auto-Cooldown Engine?
            </h4>
            <p className="text-slate-600 leading-relaxed pl-6">
              In accordance with international health regulations, donors who complete a blood donation are automatically locked for 90 days (12 weeks) to allow biological recovery before being eligible for new emergency broadcasts.
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap gap-4">
          <Link
            href="/seeker"
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all"
          >
            Create Emergency Request
          </Link>
          <Link
            href="/donor"
            className="bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] text-[#DC2626] font-bold px-6 py-3 rounded-xl text-xs sm:text-sm transition-all"
          >
            Join as Verified Donor
          </Link>
        </div>
      </div>
    </div>
  );
}
