'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const compatibilityRows = [
  { type: 'A+', donateTo: 'A+ AB+', receiveFrom: 'A+ A- O+ O-' },
  { type: 'O+', donateTo: 'O+ A+ B+ AB+', receiveFrom: 'O+ O-' },
  { type: 'B+', donateTo: 'B+ AB+', receiveFrom: 'B+ B- O+ O-' },
  { type: 'AB+', donateTo: 'AB+', receiveFrom: 'Everyone' },
  { type: 'A-', donateTo: 'A+ A- AB+ AB-', receiveFrom: 'A- O-' },
  { type: 'O-', donateTo: 'Everyone', receiveFrom: 'O-' },
  { type: 'B-', donateTo: 'B+ B- AB+ AB-', receiveFrom: 'B- O-' },
  { type: 'AB-', donateTo: 'AB+ AB-', receiveFrom: 'AB- A- B- O-' },
];

export default function LearnAboutDonation() {
  const router = useRouter();

  return (
    <section className="bg-white rounded-3xl border border-rose-100 p-6 sm:p-10 shadow-sm space-y-8">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-red-600 uppercase">
          LEARN ABOUT DONATION
        </h2>
        <div className="w-16 h-1 bg-red-600 mx-auto mt-2 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Graphic and Health Motivation */}
        <div className="lg:col-span-6 space-y-6">
          {/* IV Bag + 3 Human Silhouettes Graphic */}
          <div className="flex items-center justify-center gap-4 py-2">
            {/* Blood Bag SVG */}
            <div className="relative w-28 sm:w-32 shrink-0">
              <svg viewBox="0 0 160 220" className="w-full h-auto drop-shadow-md">
                {/* Bag Body */}
                <rect x="25" y="30" width="110" height="150" rx="20" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="3" />
                {/* Blood Fill Inside */}
                <rect x="35" y="55" width="90" height="115" rx="14" fill="#DC2626" />
                {/* Label on Bag */}
                <rect x="48" y="70" width="64" height="42" rx="4" fill="#FFFFFF" opacity="0.95" />
                <text x="80" y="96" fill="#0F172A" fontSize="24" fontWeight="bold" textAnchor="middle">B</text>
                <line x1="55" y1="104" x2="105" y2="104" stroke="#94A3B8" strokeWidth="2" strokeDasharray="2,2" />
                {/* Top Hanger */}
                <circle cx="80" cy="20" r="10" fill="none" stroke="#94A3B8" strokeWidth="4" />
                {/* Bottom Tube */}
                <path d="M80 180 L80 205 Q80 215 90 215 L140 215" fill="none" stroke="#DC2626" strokeWidth="6" strokeLinecap="round" />
              </svg>
            </div>

            {/* Drip + 3 People Silhouettes */}
            <div className="flex flex-col items-center">
              {/* Dropping Chamber + Big Red Blood Drop */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-10 bg-red-600 rounded-b-full shadow-md animate-pulse shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  <strong className="text-red-600 text-base">One</strong> Blood Donation can save upto <strong className="text-red-600 text-base">Three Lives</strong>
                </span>
              </div>

              {/* 3 Red Human Figures with raised hands */}
              <div className="flex items-end justify-center gap-3 pt-4 border-b-2 border-slate-300 w-full pb-2">
                {[1, 2, 3].map((person) => (
                  <div key={person} className="w-12 h-20 text-red-600 flex flex-col items-center">
                    {/* Head */}
                    <div className="w-7 h-7 rounded-full bg-red-600 mb-1" />
                    {/* Body with arms raised */}
                    <div className="relative w-8 h-11 bg-red-600 rounded-t-xl">
                      {/* Left Arm raised */}
                      <div className="absolute -top-1 -left-2 w-3 h-7 bg-red-600 rounded-full -rotate-45" />
                      {/* Right Arm raised */}
                      <div className="absolute -top-1 -right-2 w-3 h-7 bg-red-600 rounded-full rotate-45" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Educational Text */}
          <div className="border-l-4 border-red-600 pl-4 py-1 text-slate-700 text-sm sm:text-base leading-relaxed">
            After donating blood, the body works to replenish the blood loss. This stimulates the production of new blood cells and in turn, helps in maintaining good health.
          </div>

          {/* Action Button */}
          <div className="pt-2 text-center lg:text-left">
            <button
              onClick={() => router.push('/donor')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-lg text-sm shadow-md shadow-red-200 transition-all hover:scale-105 active:scale-95"
            >
              Donate Now
            </button>
          </div>
        </div>

        {/* Right Column: Clean Official Compatibility Table */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Table Header Bar */}
          <div className="bg-red-600 text-white px-5 py-3 font-bold text-sm sm:text-base tracking-wide flex items-center justify-between">
            <span>Compatible Blood Type Donors</span>
            <span className="text-xs font-mono opacity-90">Medical Standard</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700 font-bold">
                  <th className="py-3 px-4">Blood Type</th>
                  <th className="py-3 px-4">Donate Blood To</th>
                  <th className="py-3 px-4">Receive Blood From</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compatibilityRows.map((row) => (
                  <tr key={row.type} className="hover:bg-rose-50/40 transition-colors">
                    <td className="py-2.5 px-4 font-black text-red-600">
                      {row.type}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 font-medium">
                      {row.donateTo}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {row.receiveFrom}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
