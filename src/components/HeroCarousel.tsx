'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Activity, Heart, ShieldCheck, Zap } from 'lucide-react';

interface Slide {
  id: number;
  tagline: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  description: string;
  primaryBtnText: string;
  primaryBtnAction: string;
  secondaryBtnText: string;
  secondaryBtnAction: string;
  badgeType: 'merger' | 'emergency' | 'privacy';
}

const slides: Slide[] = [
  {
    id: 1,
    tagline: 'ONE MISSION, SAVING MORE LIVES',
    titlePrefix: 'BloodWorld and BloodDonor ',
    titleHighlight: 'have merged',
    titleSuffix: '',
    description:
      'Two organisations doing the same work are now one platform — same donors, same blood requests, whichever address you use.',
    primaryBtnText: 'Read about the merger',
    primaryBtnAction: '/about',
    secondaryBtnText: 'About us',
    secondaryBtnAction: '/about',
    badgeType: 'merger',
  },
  {
    id: 2,
    tagline: 'REAL-TIME EMERGENCY BLOOD DISPATCH',
    titlePrefix: 'Urgent Transfusions ',
    titleHighlight: 'Connected in Minutes',
    titleSuffix: '',
    description:
      'Automated biological RBC matching, PostGIS proximity radar scoring, and instant alert distribution to verified nearby donors.',
    primaryBtnText: 'Request Blood Urgently',
    primaryBtnAction: '/seeker',
    secondaryBtnText: 'Explore Live Radar',
    secondaryBtnAction: '/radar',
    badgeType: 'emergency',
  },
  {
    id: 3,
    tagline: '100% CONFIDENTIAL & SPAM-FREE',
    titlePrefix: 'Zero Contact Leakage with ',
    titleHighlight: 'Masked Virtual Proxy',
    titleSuffix: '',
    description:
      'Seekers and donors communicate securely via temporary 24-hour virtual relays. Direct cellular numbers are never exposed.',
    primaryBtnText: 'Register as Donor',
    primaryBtnAction: '/donor',
    secondaryBtnText: 'View Privacy Architecture',
    secondaryBtnAction: '/privacy',
    badgeType: 'privacy',
  },
];

export default function HeroCarousel() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const slide = slides[currentSlide];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white shadow-xl shadow-rose-200/50">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-red-900/40 blur-3xl pointer-events-none" />

      {/* Main Slide Content */}
      <div className="relative z-10 px-6 sm:px-12 py-10 sm:py-14 flex flex-col lg:flex-row items-center justify-between gap-8 min-h-[320px]">
        {/* Left Text Column */}
        <div className="max-w-2xl space-y-4 text-center lg:text-left">
          <div className="inline-block">
            <span className="text-xs font-black tracking-widest uppercase text-rose-200 bg-white/10 border border-white/20 px-3 py-1 rounded-full">
              {slide.tagline}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {slide.titlePrefix}
            <span className="text-amber-300 underline decoration-amber-400 decoration-wavy decoration-2">
              {slide.titleHighlight}
            </span>
            {slide.titleSuffix}
          </h2>

          <p className="text-sm sm:text-base text-rose-100/90 leading-relaxed font-normal">
            {slide.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <button
              onClick={() => router.push(slide.primaryBtnAction)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-6 py-2.5 rounded-full text-xs sm:text-sm shadow-lg shadow-amber-950/20 transition-all hover:scale-105 active:scale-95"
            >
              {slide.primaryBtnText}
            </button>
            <button
              onClick={() => router.push(slide.secondaryBtnAction)}
              className="bg-white/10 hover:bg-white/20 border border-white/40 text-white font-semibold px-6 py-2.5 rounded-full text-xs sm:text-sm backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
            >
              {slide.secondaryBtnText}
            </button>
          </div>
        </div>

        {/* Right Badge / Graphic Column */}
        <div className="flex items-center justify-center shrink-0">
          {slide.badgeType === 'merger' && (
            <div className="flex items-center gap-3 sm:gap-4 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-white/30 shadow-xl">
              {/* BloodWorld Badge */}
              <div className="bg-white rounded-2xl p-3 flex items-center justify-center shadow-md">
                <div className="flex items-center gap-1.5 text-red-600 font-black text-xs sm:text-sm">
                  <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="tracking-tighter">BLOODWORLD.IN</span>
                </div>
              </div>

              {/* Plus Sign */}
              <span className="text-2xl font-bold text-white/80">+</span>

              {/* BloodDonor Icon Badge */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 flex items-center justify-center shadow-md">
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white">
                  <Heart className="w-7 h-7 fill-white" />
                </div>
              </div>
            </div>
          )}

          {slide.badgeType === 'emergency' && (
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/30 text-center shadow-xl space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-white mx-auto flex items-center justify-center text-red-600 shadow-md">
                <Zap className="w-9 h-9 fill-red-600 animate-bounce" />
              </div>
              <div className="text-xs font-mono font-bold tracking-wider text-amber-300 uppercase">
                Live Dispatch Ready
              </div>
              <div className="text-sm font-black text-white">4.2 Min Avg Response</div>
            </div>
          )}

          {slide.badgeType === 'privacy' && (
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/30 text-center shadow-xl space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-white mx-auto flex items-center justify-center text-emerald-600 shadow-md">
                <ShieldCheck className="w-9 h-9 fill-emerald-100" />
              </div>
              <div className="text-xs font-mono font-bold tracking-wider text-emerald-300 uppercase">
                Twilio Proxy Mask
              </div>
              <div className="text-sm font-black text-white">100% Confidential</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        aria-label="Previous slide"
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all backdrop-blur-sm"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextSlide}
        aria-label="Next slide"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all backdrop-blur-sm"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Carousel Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`w-2 h-2 rounded-full transition-all ${
              currentSlide === idx ? 'w-6 bg-amber-400' : 'bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
