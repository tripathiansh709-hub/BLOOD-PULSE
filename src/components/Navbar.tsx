'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import {
  Radio,
  HeartHandshake,
  Dna,
  ShieldCheck,
  BellRing,
  Volume2,
  VolumeX,
  RotateCcw,
  Zap,
  Info,
  Droplet,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    soundEnabled,
    toggleSound,
    triggerSimulatedAlert,
    resetToDefaults,
    donors,
    currentDonor,
    setCurrentDonorId,
    requests,
    triggerTransition,
  } = useApp();

  const activeDonorsCount = donors.filter(
    (d) => d.status === 'AVAILABLE' && d.isEligible
  ).length;
  const emergencyRequestsCount = requests.filter(
    (r) => r.status === 'DISPATCHED' || r.status === 'ACTIVE'
  ).length;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/radar', label: 'Live Radar', icon: <Radio className="w-4 h-4" />, badge: `${activeDonorsCount} Active` },
    { href: '/seeker', label: 'Seeker Dispatch', icon: <Zap className="w-4 h-4 text-[#DC2626]" />, badge: `${emergencyRequestsCount} Urgent` },
    { href: '/donor', label: 'Donor Portal', icon: <HeartHandshake className="w-4 h-4 text-[#059669]" />, badge: currentDonor.status === 'AVAILABLE' ? 'Online' : currentDonor.status },
    { href: '/compatibility', label: 'Blood Matrix', icon: <Dna className="w-4 h-4 text-[#0D9488]" /> },
    { href: '/privacy', label: 'Privacy & Proxy', icon: <ShieldCheck className="w-4 h-4 text-[#4F46E5]" /> },
    { href: '/about', label: 'About', icon: <Info className="w-4 h-4 text-slate-500" /> },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, label: string) => {
    e.preventDefault();
    if (pathname === href) return;
    triggerTransition(`Accessing ${label}...`, () => {
      router.push(href);
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#FFE4E6] text-[#0F172A] shadow-sm">
      {/* Emergency Global Ticker Bar */}
      <div className="bg-gradient-to-r from-[#FFE4E6] via-[#FFF1F2] to-[#FFE4E6] border-b border-[#FECDD3] px-4 py-1.5 text-xs text-[#9F1239]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E11D48] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#DC2626]"></span>
            </span>
            <span className="font-extrabold tracking-wide text-[#9F1239] uppercase text-[11px]">
              CRITICAL BLOOD DISPATCH PROTOCOL:
            </span>
            <span className="text-[#334155] hidden sm:inline font-medium">
              Real-time PostGIS proximity scoring & 24h masked proxy channels active
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-[#334155] font-medium">
              Active Donors: <strong className="text-[#059669] font-bold">{activeDonorsCount}</strong>
            </span>
            <span className="text-[#FECDD3]">|</span>
            <span className="text-[#334155] font-medium">
              Open Requests: <strong className="text-[#DC2626] font-bold">{emergencyRequestsCount}</strong>
            </span>
            <span className="text-[#FECDD3]">|</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[#334155] font-medium">Identity:</span>
              <select
                aria-label="Active Donor Identity"
                value={currentDonor.id}
                onChange={(e) => setCurrentDonorId(e.target.value)}
                className="bg-white border border-[#FECDD3] text-[#9F1239] font-semibold rounded-lg px-2 py-0.5 text-xs focus:ring-1 focus:ring-[#DC2626] outline-none shadow-sm"
              >
                {donors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.bloodType}) - {d.status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={(e) => handleNavClick(e, '/', 'Home')}
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#DC2626] to-[#BE123C] flex items-center justify-center shadow-md shadow-rose-200 border border-[#F43F5E] group-hover:scale-105 transition-transform">
            <Droplet className="w-6 h-6 text-white fill-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-[#0F172A] via-[#9F1239] to-[#DC2626] bg-clip-text text-transparent">
                BloodPulse
              </h1>
              <span className="bg-[#FFE4E6] text-[#9F1239] text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#FECDD3] uppercase tracking-wider font-bold">
                Emergency 24/7
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] hidden sm:block font-medium">
              Dynamic Real-time Blood Matcher & Masked Relay
            </p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 bg-[#FFF1F2] p-1.5 rounded-2xl border border-[#FFE4E6] shadow-inner">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href, item.label)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all duration-200 ${
                  isActive
                    ? 'bg-[#DC2626] text-white shadow-md shadow-rose-200 scale-105'
                    : 'text-[#334155] hover:text-[#DC2626] hover:bg-white'
                }`}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-[#9F1239] text-[#FFF1F2]'
                        : 'bg-white text-[#334155] border border-[#FECDD3] shadow-sm'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Control Tools */}
        <div className="flex items-center space-x-2">
          {/* Quick Simulated Emergency Trigger */}
          <button
            onClick={triggerSimulatedAlert}
            title="Simulate incoming emergency alert for testing"
            className="flex items-center space-x-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-200 group active:scale-95"
          >
            <BellRing className="w-3.5 h-3.5 group-hover:animate-bounce" />
            <span className="hidden sm:inline">Test Alert</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute medical audio' : 'Enable medical audio alerts'}
            className="p-2 rounded-xl bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] text-[#334155] transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#059669]" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={resetToDefaults}
            title="Reset system to default demo state"
            className="p-2 rounded-xl bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] text-[#334155] hover:text-[#0F172A] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="flex lg:hidden overflow-x-auto px-3 py-2 bg-[#FFF1F2] border-t border-[#FFE4E6] gap-1.5 scrollbar-none">
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href, item.label)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-[#DC2626] text-white shadow-sm'
                  : 'text-[#334155] hover:text-[#DC2626] hover:bg-white'
              }`}
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
