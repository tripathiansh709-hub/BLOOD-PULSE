'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { soundManager } from '@/lib/audio';
import {
  ShieldCheck,
  PhoneCall,
  Send,
  Lock,
  Hospital,
  Droplet,
  X,
  Sparkles,
} from 'lucide-react';

export default function MaskedRelayModal() {
  const {
    isRelayModalOpen,
    closeRelayModal,
    activeRelayChannelId,
    relayChannels,
    sendChatMessage,
    completeDonation,
  } = useApp();

  const [messageInput, setMessageInput] = useState<string>('');
  const [activeSenderRole, setActiveSenderRole] = useState<'SEEKER' | 'DONOR'>('DONOR');
  const [isDialing, setIsDialing] = useState<boolean>(false);

  const channel = relayChannels.find((c) => c.id === activeRelayChannelId) || relayChannels[0];

  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 23,
    minutes: 48,
    seconds: 12,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isRelayModalOpen || !channel) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim()) return;
    sendChatMessage(channel.id, messageInput, activeSenderRole);
    setMessageInput('');
    soundManager.playRadarPing();
  };

  const handleQuickSend = (text: string) => {
    sendChatMessage(channel.id, text, activeSenderRole);
    soundManager.playRadarPing();
  };

  const handleSimulateCall = () => {
    setIsDialing(true);
    soundManager.playRadarPing();
    setTimeout(() => {
      setIsDialing(false);
    }, 4000);
  };

  const handleCompleteDonationClick = () => {
    completeDonation(channel.donorId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-rose-200 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-rose-50 via-rose-100/50 to-rose-50 px-6 py-4 border-b border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Masked Communication Bridge
                </h3>
                <span className="bg-rose-200 text-rose-900 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold">
                  Encrypted Relay
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Channel ID: {channel.id} • Both parties’ true phone numbers remain hidden
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 24-hr Expiration Countdown */}
            <div className="bg-white border border-rose-200 rounded-2xl px-3 py-1.5 text-center hidden sm:block shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-mono block font-semibold">
                Expires In
              </span>
              <span className="text-xs font-mono font-bold text-rose-700">
                {String(countdown.hours).padStart(2, '0')}:
                {String(countdown.minutes).padStart(2, '0')}:
                {String(countdown.seconds).padStart(2, '0')}
              </span>
            </div>

            <button
              onClick={closeRelayModal}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-rose-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visual Proxy Architecture Diagram Bar */}
        <div className="bg-rose-50/30 border-b border-rose-100 px-6 py-3.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Left Node: Seeker */}
            <div className="flex items-center gap-2 bg-white border border-rose-200 px-3 py-1.5 rounded-xl w-full sm:w-auto shadow-sm">
              <Hospital className="w-4 h-4 text-rose-600" />
              <div>
                <span className="text-slate-500 text-[10px] block font-medium">Seeker Hospital</span>
                <span className="font-bold text-slate-900">{channel.seekerContactMasked}</span>
              </div>
            </div>

            {/* Middle: Masked Proxy */}
            <div className="flex items-center gap-2 text-rose-700 font-mono text-center">
              <div className="h-[1px] w-6 bg-rose-300 hidden sm:block" />
              <div className="bg-rose-600 text-white px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                <Lock className="w-3 h-3 text-white" />
                <span>Proxy Mask: {channel.virtualProxyNumber}</span>
              </div>
              <div className="h-[1px] w-6 bg-rose-300 hidden sm:block" />
            </div>

            {/* Right Node: Donor */}
            <div className="flex items-center gap-2 bg-white border border-rose-200 px-3 py-1.5 rounded-xl w-full sm:w-auto shadow-sm">
              <Droplet className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-slate-500 text-[10px] block font-medium">Anonymous Donor</span>
                <span className="font-bold text-slate-900">Donor {channel.donorMaskedCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Call Virtual Proxy Simulator Bar */}
        <div className="bg-white px-6 py-2 border-b border-rose-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Simulate As:</span>
            <button
              onClick={() => setActiveSenderRole('DONOR')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeSenderRole === 'DONOR'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-slate-600 hover:text-slate-900'
              }`}
            >
              Donor ({channel.donorMaskedCode})
            </button>
            <button
              onClick={() => setActiveSenderRole('SEEKER')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeSenderRole === 'SEEKER'
                  ? 'bg-rose-800 text-white shadow-sm'
                  : 'bg-rose-50 text-slate-600 hover:text-slate-900'
              }`}
            >
              Seeker (Hospital Desk)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateCall}
              disabled={isDialing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <PhoneCall className={`w-3.5 h-3.5 ${isDialing ? 'animate-bounce' : ''}`} />
              <span>{isDialing ? 'Connecting via Mask...' : 'Test Virtual Call'}</span>
            </button>

            {channel.status === 'ACTIVE' && (
              <button
                onClick={handleCompleteDonationClick}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mark Donated (90d Cooldown)</span>
              </button>
            )}
          </div>
        </div>

        {/* Dialing Alert Overlay Banner */}
        {isDialing && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-800 flex items-center justify-between animate-pulse">
            <span className="flex items-center gap-2 font-mono font-medium">
              <PhoneCall className="w-4 h-4 animate-spin text-emerald-600" />
              Routing encrypted call through Twilio Proxy {channel.virtualProxyNumber}... Direct phone numbers never exposed.
            </span>
            <span className="font-bold text-emerald-700">CALL CONNECTED</span>
          </div>
        )}

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#FFF9FA]">
          {channel.messages.map((msg) => {
            const isSystem = msg.sender === 'SYSTEM';
            const isDonorMsg = msg.sender === 'DONOR';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center my-3">
                  <span className="bg-white border border-rose-200 text-rose-800 text-[11px] px-3 py-1 rounded-full inline-block font-mono shadow-sm">
                    🛡️ {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isDonorMsg ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-500 font-mono mb-0.5 px-1 font-medium">
                  {msg.senderMaskedName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-sm font-medium ${
                    isDonorMsg
                      ? 'bg-rose-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-rose-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Canned Emergency Replies */}
        <div className="px-6 py-2 bg-white border-t border-rose-100 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
          <span className="text-slate-500 whitespace-nowrap font-medium">Quick text:</span>
          {[
            'En route now, 5 mins away',
            'At emergency reception counter',
            'Blood requisition slip confirmed',
            'Security pass DX-4821 ready at gate',
          ].map((quick) => (
            <button
              key={quick}
              onClick={() => handleQuickSend(quick)}
              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-medium shadow-sm"
            >
              {quick}
            </button>
          ))}
        </div>

        {/* Message Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-4 bg-white border-t border-rose-100 flex items-center gap-3"
        >
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={`Type a message as ${
              activeSenderRole === 'DONOR' ? `Donor ${channel.donorMaskedCode}` : 'Hospital Seeker'
            }...`}
            className="flex-1 bg-rose-50/50 border border-rose-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-rose-500 outline-none"
          />
          <button
            type="submit"
            className="bg-rose-600 hover:bg-rose-700 text-white p-2.5 rounded-xl shadow-md transition-all flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
