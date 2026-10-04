'use client';

import React from 'react';

interface BloodDropLoaderProps {
  message?: string;
}

export default function BloodDropLoader({ message = 'Synchronizing Emergency Transfusion Matrix...' }: BloodDropLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[#FFF1F2]/80 backdrop-blur-md flex flex-col items-center justify-center p-4 transition-all duration-300">
      <div className="relative flex flex-col items-center">
        {/* Expanding Ripple Rings */}
        <div className="absolute w-24 h-24 rounded-full bg-rose-400/20 animate-ping" />
        <div className="absolute w-32 h-32 rounded-full border border-rose-300/40 animate-pulse" />

        {/* Animated Droplet SVG */}
        <div className="relative z-10 w-16 h-20 mb-3 animate-bounce" style={{ animationDuration: '1.2s' }}>
          <svg viewBox="0 0 100 130" className="w-full h-full drop-shadow-lg filter">
            <defs>
              <linearGradient id="bloodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FB7185" />
                <stop offset="40%" stopColor="#E11D48" />
                <stop offset="100%" stopColor="#9F1239" />
              </linearGradient>
              <linearGradient id="glossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Teardrop / Blood drop path */}
            <path
              d="M50 5 C50 5 92 68 92 92 C92 114 73 126 50 126 C27 126 8 114 8 92 C8 68 50 5 50 5 Z"
              fill="url(#bloodGrad)"
            />

            {/* Gloss reflection highlight */}
            <path
              d="M32 60 C38 45 48 25 48 25 C48 25 24 58 24 82 C24 94 30 102 38 106 C32 102 28 92 28 80 C28 68 32 60 32 60 Z"
              fill="url(#glossGrad)"
            />

            {/* Inner Heartbeat Wave */}
            <path
              d="M30 90 L42 90 L46 80 L52 102 L58 76 L62 94 L66 90 L72 90"
              fill="none"
              stroke="#FFE4E6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse"
            />
          </svg>
        </div>

        {/* Status Text */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <h4 className="text-sm font-bold text-slate-900 tracking-wide">
              BloodPulse Protocol
            </h4>
          </div>
          <p className="text-xs font-medium text-slate-600 font-mono">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
