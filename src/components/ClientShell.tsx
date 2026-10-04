'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import Navbar from '@/components/Navbar';
import MaskedRelayModal from '@/components/MaskedRelayModal';
import EmergencyAlertNotification from '@/components/EmergencyAlertNotification';
import BloodDropLoader from '@/components/BloodDropLoader';
import { useRouter } from 'next/navigation';
import { Activity, Zap, HeartHandshake, Dna, ShieldCheck, Compass } from 'lucide-react';

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const { isPageTransitioning, transitionMessage, triggerTransition, triggerSimulatedAlert } = useApp();
  const router = useRouter();

  const handleNav = (path: string, message: string) => {
    triggerTransition(message, () => {
      router.push(path);
    });
  };

  return (
    <div className="min-h-screen bg-[#FFF1F2] text-[#0F172A] flex flex-col font-sans selection:bg-[#DC2626] selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {children}
      </main>

      {/* Interactive Quick Workflow Scenario Dock */}
      <section className="bg-white/95 backdrop-blur-sm border-t border-[#FFE4E6] py-4 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-ping" />
            <span className="text-xs font-bold text-[#334155] uppercase tracking-wider font-mono">
              Quick Test Scenarios:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => handleNav('/seeker', 'Opening Emergency Seeker Wizard...')}
              className="bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] text-[#DC2626] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>1. Create Code Red Request</span>
            </button>

            <button
              onClick={() => {
                handleNav('/donor', 'Opening Donor Portal...');
                setTimeout(() => triggerSimulatedAlert(), 600);
              }}
              className="bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#A7F3D0] text-[#059669] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-[#059669]" />
              <span>2. Trigger Donor Push & Relay</span>
            </button>

            <button
              onClick={() => handleNav('/radar', 'Scanning PostGIS Tactical Radar...')}
              className="bg-white hover:bg-[#FFF1F2] border border-[#FECDD3] text-[#334155] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Compass className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>3. Live Radar Dispatch</span>
            </button>

            <button
              onClick={() => handleNav('/compatibility', 'Loading Biological 8x8 Crossmatch...')}
              className="bg-[#F0FDFA] hover:bg-[#CCFBF1] border border-[#99F6E4] text-[#0D9488] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Dna className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>4. Explore 8x8 Compatibility</span>
            </button>

            <button
              onClick={() => handleNav('/privacy', 'Verifying Virtual Proxy Encryption...')}
              className="bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] text-[#4F46E5] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>5. Twilio Proxy Architecture</span>
            </button>
          </div>
        </div>
      </section>

      {/* Modern Medical Footer */}
      <footer className="border-t border-[#FFE4E6] bg-white py-6 px-4 text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#DC2626]" />
            <span className="font-bold text-[#0F172A]">
              Dynamic Emergency Blood Matcher Protocol
            </span>
            <span className="text-[#CBD5E1]">•</span>
            <span className="font-semibold text-[#DC2626]">PRD v1.0 Compliant</span>
          </div>

          <div className="flex items-center gap-4 text-[#334155] font-medium">
            <span>PostGIS Geolocation</span>
            <span>•</span>
            <span>Biological Crossmatch</span>
            <span>•</span>
            <span className="text-[#059669] font-bold">Twilio Proxy Masking Active</span>
          </div>
        </div>
      </footer>

      {/* Global Modals & Notifications */}
      <MaskedRelayModal />
      <EmergencyAlertNotification />

      {/* Blood Drop Loading Animation during page / tab switch */}
      {isPageTransitioning && <BloodDropLoader message={transitionMessage} />}
    </div>
  );
}
