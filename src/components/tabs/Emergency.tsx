import React, { useState, useEffect } from 'react';
import { Phone, Megaphone, CheckCircle, Route, EyeOff, Send, Shield, HeartPulse, Flame, MessageSquare, Mic, ChevronDown, ChevronUp, Activity, Users, Video, Smartphone, Monitor, AlertTriangle, Layers, BellRing, Radio, X, ThermometerSun } from 'lucide-react';
import { Responder, TelemetryData } from '../../types';

interface EmergencyProps {
  responders: Responder[];
  telemetry: TelemetryData;
}

const Emergency = React.memo(function Emergency({ responders, telemetry }: EmergencyProps) {
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [previewMode, setPreviewMode] = useState<'mobile' | 'signage'>('mobile');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [activeMapTooltip, setActiveMapTooltip] = useState<string | null>(null);
  const [mapLayers, setMapLayers] = useState({
    density: true,
    staff: true,
    exits: false
  });

  const [targetSectors, setTargetSectors] = useState<string[]>(['ALL SECTORS']);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [activeCommChannel, setActiveCommChannel] = useState<'police' | 'emt' | 'fire'>('police');

  const [policeInput, setPoliceInput] = useState('');
  const [policeMessages, setPoliceMessages] = useState([
    { sender: 'them', text: 'Dispatch, we have a Code 3 at Gate C. Overcrowding, requesting crowd control units.', time: '10:42 AM' },
    { sender: 'me', text: 'Copy that. Units 7 and 9 are en route. ETA 2 minutes.', time: '10:43 AM' }
  ]);

  const handleSendPoliceMessage = () => {
    if (!policeInput.trim()) return;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setPoliceMessages(prev => [...prev, { sender: 'me', text: policeInput, time: timeString }]);
    setPoliceInput('');
    
    // Simulate reply
    setTimeout(() => {
      const replyTime = new Date();
      const replyTimeString = replyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setPoliceMessages(prev => [...prev, { sender: 'them', text: 'Copy that. Standing by.', time: replyTimeString }]);
    }, 2000);
  };

  // Telemetry state is now passed via props

  const handlePushBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    setTimeout(() => {
      setIsBroadcasting(false);
      setBroadcastMessage('');
      setTargetSectors(['ALL SECTORS']);
    }, 1500);
  };

  const getMapStyle = () => {
    if (expandedIncident === 'inc-new') return { transform: 'scale(1.5)', transformOrigin: '70% 20%' };
    if (expandedIncident === 'inc-1') return { transform: 'scale(1.5)', transformOrigin: '25% 33.33%' };
    if (expandedIncident === 'inc-2') return { transform: 'scale(1.5)', transformOrigin: '50% 60%' };
    return { transform: 'scale(1)', transformOrigin: '50% 50%' };
  };

  const toggleIncident = (id: string) => {
    setExpandedIncident(expandedIncident === id ? null : id);
  };

  const toggleLayer = (layer: keyof typeof mapLayers) => {
    setMapLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const playAlertSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      
      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + startTime + 0.05);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + startTime + duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start(audioCtx.currentTime + startTime);
        oscillator.stop(audioCtx.currentTime + startTime + duration);
      };

      // Play a distinct "high-low-high" emergency pattern
      playTone(880, 0, 0.15); // A5
      playTone(659.25, 0.2, 0.15); // E5
      playTone(880, 0.4, 0.15); // A5
      playTone(659.25, 0.6, 0.15); // E5
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const triggerNewAlert = () => {
    playAlertSound();
    setShowNewAlert(true);
    if (!expandedIncident) {
      setExpandedIncident('inc-new');
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templates: Record<string, string> = {
      'Standard Emergency Evacuation': 'EMERGENCY: Please proceed calmly to the nearest exit. Follow staff instructions.',
      'Entry/Exit Redirection': 'NOTICE: Gate C is currently at capacity. Please use Gates B or D for entry/exit.',
      'Severe Weather Warning': 'WEATHER ALERT: Severe weather approaching. Please seek shelter in the interior concourses.',
      'Lost Child Protocol': 'SECURITY: Code Adam active. Please report any unaccompanied children to the nearest staff member.'
    };
    setBroadcastMessage(templates[e.target.value] || '');
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-headline text-5xl font-black text-primary tracking-tighter uppercase leading-none">Emergency Response</h1>
          <p className="text-slate-400 mt-2 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
            LIVE NETWORK STATUS: CRITICAL - {telemetry.activeIncidents} ACTIVE INCIDENTS
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button className="px-6 py-3 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2 hover:bg-surface-container-high transition-colors">
            <Phone className="text-error" size={20} fill="currentColor" />
            Authority Direct Line
          </button>
          <button className="px-6 py-3 rounded-xl bg-error/20 text-error border border-error/30 font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
            <Megaphone size={20} fill="currentColor" />
            Initiate Global Broadcast
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Live Incident Feed */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface-container-low rounded-xl p-6 shadow-[0px_20px_40px_rgba(0,219,233,0.06)] h-full border border-white/5">
            <h3 className="font-label text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                Active Incidents
                <button 
                  onClick={triggerNewAlert} 
                  className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors" 
                  title="Simulate Incoming Alert"
                >
                  <BellRing size={14} />
                </button>
              </div>
              <span className="px-2 py-0.5 bg-error/20 text-error rounded text-[10px]">Priority Alpha</span>
            </h3>
            <div className="space-y-4">
              {/* New Simulated Alert */}
              {showNewAlert && (
                <div 
                  className={`p-4 rounded-xl bg-surface-container border-l-4 border-error cursor-pointer transition-all hover:bg-surface-container-high animate-in fade-in slide-in-from-top-4 ${expandedIncident === 'inc-new' ? 'ring-1 ring-error/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : ''}`}
                  onClick={() => toggleIncident('inc-new')}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-error font-bold text-sm uppercase tracking-tight flex items-center gap-1">
                      <Flame size={14} /> Fire Alarm Triggered
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-error font-bold uppercase animate-pulse">Just Now</span>
                      {expandedIncident === 'inc-new' ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </div>
                  </div>
                  <h4 className="font-headline text-lg font-bold text-primary tracking-tight">Sector 4 - Concourse B</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Smoke detector activated in concession area. Auto-suppression system on standby.</p>
                  
                  {/* Expanded Details */}
                  {expandedIncident === 'inc-new' && (
                    <div className="mt-4 pt-4 border-t border-outline-variant/20 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-surface-container-lowest p-2 rounded-lg">
                          <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Status</span>
                          <span className="text-xs text-error font-bold flex items-center gap-1"><Activity size={12}/> Critical</span>
                        </div>
                        <div className="bg-surface-container-lowest p-2 rounded-lg">
                          <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Responders</span>
                          <span className="text-xs text-white font-medium flex items-center gap-1"><Shield size={12}/> Fire Team Alpha</span>
                        </div>
                        <div className="bg-surface-container-lowest p-3 rounded-lg col-span-2 flex justify-between items-center border border-error/30 bg-error/5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1"><ThermometerSun size={14} className="text-error" /> Core Temp</span>
                          <span className="text-xl text-error font-mono font-bold tracking-tight">{telemetry.fireTemp}°C</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-1.5 rounded-lg bg-surface-container-high text-white text-[10px] font-bold uppercase tracking-tighter hover:bg-surface-container-highest transition-colors flex-1 flex items-center justify-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Video size={12} /> View Feed
                        </button>
                        <button 
                          className="px-3 py-1.5 rounded-lg bg-error/20 text-error text-[10px] font-bold uppercase tracking-tighter hover:bg-error/30 transition-colors flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Evacuate Sector
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Collapsed Buttons */}
                  {expandedIncident !== 'inc-new' && (
                    <div className="flex gap-2 mt-4">
                      <button 
                        className="px-3 py-1.5 rounded-lg bg-surface-container-high text-white text-[10px] font-bold uppercase tracking-tighter hover:bg-surface-container-highest transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Feed
                      </button>
                      <button 
                        className="px-3 py-1.5 rounded-lg bg-error/20 text-error text-[10px] font-bold uppercase tracking-tighter hover:bg-error/30 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Evacuate Sector
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Alert 1 */}
              <div 
                className={`p-4 rounded-xl bg-surface-container border-l-4 border-error cursor-pointer transition-all hover:bg-surface-container-high ${expandedIncident === 'inc-1' ? 'ring-1 ring-error/30' : ''}`}
                onClick={() => toggleIncident('inc-1')}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-error font-bold text-sm uppercase tracking-tight">Overcrowding Event</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-medium uppercase">02:45m Ago</span>
                    {expandedIncident === 'inc-1' ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </div>
                </div>
                <h4 className="font-headline text-lg font-bold text-primary tracking-tight">Gate C Entrance</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Capacity exceeded by 24%. Crowd pressure increasing at turnstiles. Immediate redirection required.</p>
                
                {/* Expanded Details */}
                {expandedIncident === 'inc-1' && (
                  <div className="mt-4 pt-4 border-t border-outline-variant/20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Status</span>
                        <span className="text-xs text-error font-bold flex items-center gap-1"><Activity size={12}/> Critical</span>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Responders</span>
                        <span className="text-xs text-white font-medium flex items-center gap-1"><Users size={12}/> Unit 7, 9 (En route)</span>
                      </div>
                      <div className="bg-surface-container-lowest p-3 rounded-lg col-span-2 flex justify-between items-center border border-error/30 bg-error/5">
                        <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1"><Users size={14} className="text-error" /> Crowd Density</span>
                        <span className="text-xl text-error font-mono font-bold tracking-tight">{telemetry.crowdDensity}%</span>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg col-span-2">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Action Taken</span>
                        <span className="text-xs text-slate-300">Automated turnstile slow-down initiated. Redirecting flow to Gate B.</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="px-3 py-1.5 rounded-lg bg-surface-container-high text-white text-[10px] font-bold uppercase tracking-tighter hover:bg-surface-container-highest transition-colors flex-1 flex items-center justify-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Video size={12} /> View Feed
                      </button>
                      <button 
                        className="px-3 py-1.5 rounded-lg bg-primary-container/10 text-primary-container text-[10px] font-bold uppercase tracking-tighter hover:bg-primary-container/20 transition-colors flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Dispatch Staff
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Collapsed Buttons */}
                {expandedIncident !== 'inc-1' && (
                  <div className="flex gap-2 mt-4">
                    <button 
                      className="px-3 py-1.5 rounded-lg bg-surface-container-high text-white text-[10px] font-bold uppercase tracking-tighter hover:bg-surface-container-highest transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Feed
                    </button>
                    <button 
                      className="px-3 py-1.5 rounded-lg bg-primary-container/10 text-primary-container text-[10px] font-bold uppercase tracking-tighter hover:bg-primary-container/20 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Dispatch Staff
                    </button>
                  </div>
                )}
              </div>
              
              {/* Alert 2 */}
              <div 
                className={`p-4 rounded-xl bg-surface-container border-l-4 border-tertiary-fixed-dim cursor-pointer transition-all hover:bg-surface-container-high ${expandedIncident === 'inc-2' ? 'ring-1 ring-tertiary-fixed-dim/30' : ''}`}
                onClick={() => toggleIncident('inc-2')}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-tertiary-fixed-dim font-bold text-sm uppercase tracking-tight">Medical Emergency</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-medium uppercase">08:12m Ago</span>
                    {expandedIncident === 'inc-2' ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </div>
                </div>
                <h4 className="font-headline text-lg font-bold text-primary tracking-tight">Sector 102 - Row J</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Reports of fainting/heat stroke. EMT Unit 04 dispatched. ETA: 3 minutes.</p>
                
                {/* Expanded Details */}
                {expandedIncident === 'inc-2' && (
                  <div className="mt-4 pt-4 border-t border-outline-variant/20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Status</span>
                        <span className="text-xs text-tertiary-fixed-dim font-bold flex items-center gap-1"><Activity size={12}/> Active</span>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Responders</span>
                        <span className="text-xs text-white font-medium flex items-center gap-1"><HeartPulse size={12}/> EMT Unit 04</span>
                      </div>
                      <div className="bg-surface-container-lowest p-3 rounded-lg col-span-2 flex justify-between items-center border border-tertiary-fixed-dim/30 bg-tertiary-fixed-dim/5">
                        <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1"><HeartPulse size={14} className="text-tertiary-fixed-dim" /> Patient HR</span>
                        <span className="text-xl text-tertiary-fixed-dim font-mono font-bold tracking-tight">{telemetry.patientHeartRate} BPM</span>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg col-span-2">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Action Taken</span>
                        <span className="text-xs text-slate-300">Nearby stewards securing the area. Defibrillator requested.</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="px-3 py-1.5 rounded-lg bg-surface-container-high text-white text-[10px] font-bold uppercase tracking-tighter hover:bg-surface-container-highest transition-colors flex-1 flex items-center justify-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageSquare size={12} /> Comms
                      </button>
                      <button 
                        className="px-3 py-1.5 rounded-lg bg-tertiary-fixed-dim/10 text-tertiary-fixed-dim text-[10px] font-bold uppercase tracking-tighter hover:bg-tertiary-fixed-dim/20 transition-colors flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        EMT Tracking
                      </button>
                    </div>
                  </div>
                )}

                {/* Collapsed Buttons */}
                {expandedIncident !== 'inc-2' && (
                  <div className="flex gap-2 mt-4">
                    <button 
                      className="px-3 py-1.5 rounded-lg bg-surface-container-high text-white text-[10px] font-bold uppercase tracking-tighter hover:bg-surface-container-highest transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Comms
                    </button>
                    <button 
                      className="px-3 py-1.5 rounded-lg bg-tertiary-fixed-dim/10 text-tertiary-fixed-dim text-[10px] font-bold uppercase tracking-tighter hover:bg-tertiary-fixed-dim/20 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      EMT Tracking
                    </button>
                  </div>
                )}
              </div>
              
              {/* Muted History */}
              <div className="pt-4 border-t border-outline-variant/20">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Resolved (Past 1h)</h5>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-secondary-fixed" />
                    Unattended Bag - Sector 4
                  </div>
                  <span>14:32</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Map / Route Planner */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-xl overflow-hidden relative group border border-white/5">
          <div className="absolute bottom-6 right-6 z-10">
            <div className="bg-surface-container-low/80 backdrop-blur-md p-4 rounded-xl border border-outline-variant/20 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-8">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Density</span>
                <span className="text-sm font-black text-secondary-fixed">82%</span>
              </div>
              <div className="w-32 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-secondary-fixed w-[82%]"></div>
              </div>
              <div className="flex items-center justify-between gap-8">
                <span className="text-[10px] font-bold uppercase text-slate-400">Exit Clearances</span>
                <span className="text-sm font-black text-primary-container">Optimal</span>
              </div>
            </div>
          </div>
          
          <div 
            className="w-full aspect-square md:aspect-video lg:h-[600px] bg-[#0a0e17] relative overflow-hidden cursor-crosshair rounded-xl"
            onClick={() => setExpandedIncident(null)}
          >
            <div 
              className="absolute inset-0 transition-all duration-700 ease-in-out"
              style={getMapStyle()}
            >
              <img 
                className="w-full h-full object-cover opacity-40 mix-blend-screen" 
                alt="Stadium Map" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBI8DbE5nn6tWC7JDI1A1z3dYFm3Wd8KJVDXr_R_TIeR-gDR07q0lAdexTL-jzpX-f6Q1fzJT4Q0OGcu7rhm6dZQ2scDosjazPwAB5YdOHQX5xNsvASeB2jE4N1Mtz3IQdY8WvAp6TwidCvyqvQd5UDv1e8e9xi7Y7ec-Dx3gxPQ9HyEwqdvmrGuH85WbtYlmuZ8wGOzmBOTltzX2RMrcOiRocwqRQW9wIDMEtooG_6gzfwBptk4yBPEP72QODtb8_sLrU17JQxLQeg"
                referrerPolicy="no-referrer"
              />
              {/* Tactical Overlays */}
              <div className="absolute inset-0">
              {/* Incident Specific Overlays (Dynamic based on expanded incident) */}
              <div className="absolute inset-0 pointer-events-none z-30">
                {/* Fire Hotspot */}
                {showNewAlert && (
                  <div className={`absolute top-[20%] left-[70%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer transition-all duration-300 ${expandedIncident === 'inc-new' ? 'scale-110 z-40' : 'scale-75 z-30 opacity-80 hover:opacity-100 hover:scale-90'}`} onClick={(e) => { e.stopPropagation(); toggleIncident('inc-new'); }}>
                    <div className="relative flex items-center justify-center">
                      {expandedIncident === 'inc-new' && (
                        <div className="absolute w-48 h-48 bg-orange-500/30 rounded-full animate-pulse blur-xl pointer-events-none"></div>
                      )}
                      <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-75"></div>
                      <div className="relative bg-orange-500 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white shadow-[0_0_20px_rgba(249,115,22,0.8)]">
                        <Flame size={16} />
                      </div>
                    </div>
                    {expandedIncident === 'inc-new' && (
                      <div className="mt-3 bg-surface-container-highest/95 backdrop-blur-md p-3 rounded-xl border border-orange-500/50 whitespace-nowrap shadow-2xl animate-in fade-in zoom-in-95">
                        <p className="text-xs font-black text-orange-500 uppercase flex items-center gap-2">
                          <AlertTriangle size={14} /> Fire Alarm - Sector 4
                        </p>
                        <p className="text-[10px] text-slate-300 mt-1 font-medium">Fire Team Alpha En Route (ETA: 45s)</p>
                        <div className="mt-2 flex items-center justify-between bg-black/50 rounded p-1.5 border border-orange-500/30">
                          <span className="text-[9px] text-slate-400 uppercase">Core Temp</span>
                          <span className="text-[10px] font-mono font-bold text-orange-500">{telemetry.fireTemp}°F</span>
                        </div>
                        <div className="mt-2 w-full h-24 bg-black rounded-lg border border-white/10 relative overflow-hidden">
                          <img src="https://images.unsplash.com/photo-1542622759-4509172088b8?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover opacity-60" alt="Camera Feed" />
                          <div className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded animate-pulse">REC</div>
                          <div className="absolute bottom-1 left-1 text-white text-[8px] font-mono">CAM-402</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Gate C Highlight */}
                <div className={`absolute top-[33.33%] left-[25%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer transition-all duration-300 ${expandedIncident === 'inc-1' ? 'scale-110 z-40' : 'scale-75 z-30 opacity-80 hover:opacity-100 hover:scale-90'}`} onClick={(e) => { e.stopPropagation(); toggleIncident('inc-1'); }}>
                  <div className="relative flex items-center justify-center">
                    {expandedIncident === 'inc-1' && (
                      <div className="absolute w-48 h-48 bg-error/30 rounded-full animate-pulse blur-xl pointer-events-none"></div>
                    )}
                    <div className="absolute inset-0 bg-error rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-error w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.8)]">
                      <Users size={16} />
                    </div>
                  </div>
                  {expandedIncident === 'inc-1' && (
                    <div className="mt-3 bg-surface-container-highest/95 backdrop-blur-md p-3 rounded-xl border border-error/50 whitespace-nowrap shadow-2xl animate-in fade-in zoom-in-95">
                      <p className="text-xs font-black text-error uppercase flex items-center gap-2">
                        <AlertTriangle size={14} /> Gate C Overcrowd
                      </p>
                      <p className="text-[10px] text-slate-300 mt-1 font-medium">Units 7 & 9 Responding</p>
                      <div className="mt-2 flex items-center justify-between bg-black/50 rounded p-1.5 border border-error/30">
                        <span className="text-[9px] text-slate-400 uppercase">Density</span>
                        <span className="text-[10px] font-mono font-bold text-error">{telemetry.crowdDensity}%</span>
                      </div>
                      <div className="mt-2 w-full h-24 bg-black rounded-lg border border-white/10 relative overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover opacity-60" alt="Camera Feed" />
                        <div className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded animate-pulse">REC</div>
                        <div className="absolute bottom-1 left-1 text-white text-[8px] font-mono">CAM-112</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Medical Highlight */}
                <div className={`absolute top-[60%] left-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer transition-all duration-300 ${expandedIncident === 'inc-2' ? 'scale-110 z-40' : 'scale-75 z-30 opacity-80 hover:opacity-100 hover:scale-90'}`} onClick={(e) => { e.stopPropagation(); toggleIncident('inc-2'); }}>
                  <div className="relative flex items-center justify-center">
                    {expandedIncident === 'inc-2' && (
                      <div className="absolute w-48 h-48 bg-tertiary-fixed-dim/30 rounded-full animate-pulse blur-xl pointer-events-none"></div>
                    )}
                    <div className="absolute inset-0 bg-tertiary-fixed-dim rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-tertiary-fixed-dim w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-black shadow-[0_0_20px_rgba(251,188,0,0.8)]">
                      <HeartPulse size={16} />
                    </div>
                  </div>
                  {expandedIncident === 'inc-2' && (
                    <div className="mt-3 bg-surface-container-highest/95 backdrop-blur-md p-3 rounded-xl border border-tertiary-fixed-dim/50 whitespace-nowrap shadow-2xl animate-in fade-in zoom-in-95">
                      <p className="text-xs font-black text-tertiary-fixed-dim uppercase flex items-center gap-2">
                        <AlertTriangle size={14} /> Medical Emergency
                      </p>
                      <p className="text-[10px] text-slate-300 mt-1 font-medium">EMT-4 On Scene - Stabilizing</p>
                      <div className="mt-2 flex items-center justify-between bg-black/50 rounded p-1.5 border border-tertiary-fixed-dim/30">
                        <span className="text-[9px] text-slate-400 uppercase">Heart Rate</span>
                        <span className="text-[10px] font-mono font-bold text-tertiary-fixed-dim">{telemetry.patientHeartRate} BPM</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Density Layer */}
              {mapLayers.density && (
                <div className="animate-in fade-in duration-300 pointer-events-none">
                  {/* Gate C Hotspot */}
                  <div className="absolute top-1/3 left-1/4 w-32 h-32 rounded-full bg-error/20 blur-2xl animate-pulse"></div>
                  <div 
                    className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto z-20"
                    onMouseEnter={() => setActiveMapTooltip('gate-c')}
                    onMouseLeave={() => setActiveMapTooltip(null)}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-error rounded-full animate-ping opacity-75"></div>
                      <div className="relative bg-error w-4 h-4 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="mt-2 bg-surface-container-low/80 backdrop-blur-md p-2 rounded-lg border border-error/50 whitespace-nowrap">
                      <p className="text-[10px] font-black text-error uppercase">Gate C Overcrowd</p>
                    </div>
                    
                    {/* Tooltip */}
                    {activeMapTooltip === 'gate-c' && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-surface-container-high/95 backdrop-blur-md border border-error/30 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={14} className="text-error" />
                          <span className="text-[10px] font-bold uppercase text-error tracking-wider">Gate C Status</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Pressure</span>
                            <span className="text-error font-bold">Critical</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Flow</span>
                            <span className="text-white font-bold">Blocked</span>
                          </div>
                          <button className="w-full mt-2 py-1.5 bg-error/20 text-error text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1 hover:bg-error/30 transition-colors">
                            <Video size={12} /> View Feed
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Flow Arrows */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 300 250 Q 450 200 600 250" fill="transparent" stroke="#79ff5b" strokeDasharray="5,5" strokeWidth="2"></path>
                    <path d="M 300 250 Q 450 350 600 350" fill="transparent" stroke="#79ff5b" strokeDasharray="5,5" strokeWidth="2"></path>
                    <circle cx="300" cy="250" fill="#79ff5b" r="4"></circle>
                  </svg>
                </div>
              )}

              {/* Staff Layer */}
              {mapLayers.staff && (
                <div className="animate-in fade-in duration-300 pointer-events-none">
                  {responders.map(unit => {
                    const isSecurity = unit.type === 'security';
                    const isMedical = unit.type === 'medical';
                    const colorClass = isSecurity ? 'bg-primary-container' : isMedical ? 'bg-tertiary-fixed-dim' : 'bg-orange-500';
                    const textClass = isSecurity ? 'text-primary-container' : isMedical ? 'text-tertiary-fixed-dim' : 'text-orange-500';
                    const shadowClass = isSecurity ? 'shadow-[0_0_10px_rgba(0,240,255,0.8)]' : isMedical ? 'shadow-[0_0_10px_rgba(251,188,0,0.8)]' : 'shadow-[0_0_10px_rgba(249,115,22,0.8)]';
                    const Icon = isSecurity ? Shield : isMedical ? HeartPulse : Flame;

                    return (
                      <div 
                        key={unit.id}
                        className="absolute flex flex-col items-center cursor-pointer pointer-events-auto z-20 transition-all duration-1000 ease-linear"
                        style={{ top: `${unit.top}%`, left: `${unit.left}%`, transform: 'translate(-50%, -50%)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMapTooltip(activeMapTooltip === unit.id ? null : unit.id);
                        }}
                      >
                        <div className="relative flex items-center justify-center">
                          {unit.status === 'On Scene' && (
                            <div className={`absolute inset-0 ${colorClass} rounded-full animate-ping opacity-75`}></div>
                          )}
                          <div className={`relative w-4 h-4 ${colorClass} rounded-full border-2 border-white ${shadowClass} flex items-center justify-center text-surface-container-lowest`}>
                            <Icon size={8} />
                          </div>
                        </div>
                        <span className={`text-[8px] font-bold ${textClass} mt-1 bg-surface-container-lowest/80 px-1 rounded whitespace-nowrap`}>
                          {unit.name.replace('Unit ', 'U-').replace('EMT ', '')}
                        </span>
                        
                        {activeMapTooltip === unit.id && (
                          <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-surface-container-high/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Icon size={14} className={textClass} />
                                <span className={`text-[10px] font-bold uppercase ${textClass} tracking-wider`}>{unit.name}</span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMapTooltip(null);
                                }}
                                className="text-slate-400 hover:text-white transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Type</span>
                                <span className="text-white font-bold capitalize">{unit.type}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Status</span>
                                <span className={`font-bold flex items-center gap-1 ${unit.status === 'On Scene' ? textClass : 'text-white'}`}>
                                  {unit.status === 'On Scene' && <span className={`w-1.5 h-1.5 rounded-full ${colorClass} animate-pulse`}></span>}
                                  {unit.status}
                                </span>
                              </div>
                              {unit.eta && unit.status === 'En Route' && (
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-400">ETA</span>
                                  <span className={`${textClass} font-bold`}>{unit.eta}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Exits Layer */}
              {mapLayers.exits && (
                <div className="animate-in fade-in duration-300 pointer-events-none">
                  <div className="absolute top-[15%] left-[15%] bg-secondary-fixed text-on-secondary-fixed px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border border-white/50 shadow-[0_0_15px_rgba(121,255,91,0.4)]">Exit A</div>
                  <div className="absolute top-[15%] right-[15%] bg-secondary-fixed text-on-secondary-fixed px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border border-white/50 shadow-[0_0_15px_rgba(121,255,91,0.4)]">Exit B</div>
                  <div className="absolute bottom-[15%] left-[15%] bg-secondary-fixed text-on-secondary-fixed px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border border-white/50 shadow-[0_0_15px_rgba(121,255,91,0.4)]">Exit C</div>
                  <div className="absolute bottom-[15%] right-[15%] bg-secondary-fixed text-on-secondary-fixed px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border border-white/50 shadow-[0_0_15px_rgba(121,255,91,0.4)]">Exit D</div>
                </div>
              )}
            </div>
            </div>
          </div>

          <div className="absolute top-6 right-6 z-50 flex flex-col gap-2 items-end">
            <div className="bg-surface-container-low/80 backdrop-blur-md px-4 py-2 rounded-xl border border-outline-variant/20">
              <h3 className="font-headline text-sm font-bold text-primary uppercase tracking-tight">Evacuation Route Planner</h3>
            </div>
            <div className="flex gap-2">
              <button className="bg-surface-container-highest px-3 py-2 rounded-lg text-xs font-bold text-secondary-fixed flex items-center gap-1 border border-secondary-fixed/20 hover:bg-surface-container-highest/80 transition-colors">
                <Route size={14} /> Optimize
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowLayerMenu(!showLayerMenu)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 border transition-colors ${
                    showLayerMenu 
                      ? 'bg-surface-container-highest border-primary-container text-primary-container' 
                      : 'bg-surface-container-highest border-outline-variant/20 text-slate-300 hover:bg-surface-container-highest/80'
                  }`}
                >
                  <Layers size={14} /> Layers
                </button>
                
                {showLayerMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 flex flex-col gap-1">
                      <label className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={mapLayers.density} 
                          onChange={() => toggleLayer('density')} 
                          className="rounded border-outline-variant/30 text-primary-container focus:ring-primary-container/30 bg-surface-container-lowest w-4 h-4" 
                        />
                        <span className="text-xs font-medium text-slate-200">Crowd Density</span>
                      </label>
                      <label className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={mapLayers.staff} 
                          onChange={() => toggleLayer('staff')} 
                          className="rounded border-outline-variant/30 text-primary-container focus:ring-primary-container/30 bg-surface-container-lowest w-4 h-4" 
                        />
                        <span className="text-xs font-medium text-slate-200">Staff Locations</span>
                      </label>
                      <label className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={mapLayers.exits} 
                          onChange={() => toggleLayer('exits')} 
                          className="rounded border-outline-variant/30 text-primary-container focus:ring-primary-container/30 bg-surface-container-lowest w-4 h-4" 
                        />
                        <span className="text-xs font-medium text-slate-200">Emergency Exits</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-6 left-6 z-50">
            <div className="flex items-center gap-3 glass-panel p-3 rounded-2xl border border-white/5">
              <div className="w-32 h-2 bg-gradient-to-r from-secondary-fixed via-tertiary-fixed-dim to-error rounded-full"></div>
              <span className="text-[10px] font-bold uppercase text-slate-300">Density Scale</span>
            </div>
          </div>
        </div>

        {/* Broadcast Controls */}
        <div className="col-span-12 lg:col-span-7 bg-surface-container-low rounded-xl p-6 shadow-[0px_20px_40px_rgba(0,219,233,0.06)] border border-white/5 flex flex-col">
          <h3 className="font-label text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Broadcast Alert Control</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Target Sectors</label>
                <div className="flex flex-wrap gap-2">
                  {['ALL SECTORS', 'Sector 100-105', 'Gate Areas'].map(sector => (
                    <span 
                      key={sector}
                      onClick={() => {
                        if (sector === 'ALL SECTORS') {
                          setTargetSectors(['ALL SECTORS']);
                        } else {
                          const newSectors = targetSectors.includes('ALL SECTORS') 
                            ? [sector] 
                            : targetSectors.includes(sector)
                              ? targetSectors.filter(s => s !== sector)
                              : [...targetSectors, sector];
                          setTargetSectors(newSectors.length ? newSectors : ['ALL SECTORS']);
                        }
                      }}
                      className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                        targetSectors.includes(sector) 
                          ? 'bg-primary-container text-on-primary-container' 
                          : 'bg-surface-container-highest text-slate-300 hover:bg-surface-container-highest/80'
                      }`}
                    >
                      {sector}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Message Template</label>
                <select 
                  onChange={handleTemplateChange}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl py-2 px-3 text-sm text-slate-300 focus:ring-1 focus:ring-primary-container/30 outline-none"
                >
                  <option value="">-- Custom Message --</option>
                  <option value="Standard Emergency Evacuation">Standard Emergency Evacuation</option>
                  <option value="Entry/Exit Redirection">Entry/Exit Redirection</option>
                  <option value="Severe Weather Warning">Severe Weather Warning</option>
                  <option value="Lost Child Protocol">Lost Child Protocol</option>
                </select>
              </div>
              <div className="flex flex-col gap-4 flex-1">
                <textarea 
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="flex-1 w-full min-h-[100px] bg-surface-container border border-outline-variant/20 rounded-xl p-3 text-sm text-slate-300 placeholder:text-slate-500 focus:ring-1 focus:ring-primary-container/30 outline-none resize-none" 
                  placeholder="Compose custom broadcast message..."
                ></textarea>
                <button 
                  onClick={handlePushBroadcast}
                  disabled={isBroadcasting || !broadcastMessage.trim()}
                  className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-auto ${
                    isBroadcasting || !broadcastMessage.trim()
                      ? 'bg-surface-container-highest text-slate-500 cursor-not-allowed'
                      : 'bg-error/20 border border-error/30 text-error hover:bg-error/30'
                  }`}
                >
                  {isBroadcasting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-error border-t-transparent rounded-full animate-spin"></div>
                      Broadcasting...
                    </span>
                  ) : (
                    <>
                      <Send size={16} />
                      Push to {targetSectors.includes('ALL SECTORS') ? 'All Channels' : 'Selected Sectors'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Real-time Preview */}
            <div className="bg-surface-container rounded-xl border border-outline-variant/10 p-4 flex flex-col h-full min-h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Preview</label>
                <div className="flex gap-1 bg-surface-container-highest p-1 rounded-lg">
                  <button 
                    onClick={() => setPreviewMode('mobile')}
                    className={`p-1.5 rounded-md transition-colors ${previewMode === 'mobile' ? 'bg-surface-container-low text-primary-container shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    title="Mobile App Push"
                  >
                    <Smartphone size={14} />
                  </button>
                  <button 
                    onClick={() => setPreviewMode('signage')}
                    className={`p-1.5 rounded-md transition-colors ${previewMode === 'signage' ? 'bg-surface-container-low text-primary-container shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    title="Digital Signage"
                  >
                    <Monitor size={14} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center bg-[#0a0e17] rounded-lg overflow-hidden relative border border-white/5 p-4">
                {previewMode === 'mobile' ? (
                  <div className="w-[160px] h-[320px] bg-slate-900 rounded-[2rem] border-[6px] border-slate-800 relative overflow-hidden flex flex-col shadow-2xl">
                    {/* Notch */}
                    <div className="absolute top-0 inset-x-0 h-3 bg-slate-800 rounded-b-xl mx-10 z-10"></div>
                    {/* Wallpaper mock */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900 opacity-50"></div>
                    
                    {/* Notification */}
                    <div className="relative mt-10 mx-2 bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/10 shadow-lg animate-in slide-in-from-top-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-3 h-3 rounded bg-error flex items-center justify-center">
                          <AlertTriangle size={8} className="text-white" />
                        </div>
                        <span className="text-[8px] font-bold text-white/80 uppercase tracking-wider">Venue Alert</span>
                        <span className="text-[8px] text-white/50 ml-auto">Now</span>
                      </div>
                      <p className="text-[10px] text-white leading-tight font-medium line-clamp-5 break-words">
                        {broadcastMessage || "Emergency alert message will appear here..."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-black rounded-lg border-4 border-slate-800 flex flex-col relative overflow-hidden shadow-2xl">
                    <div className="h-6 bg-error flex items-center justify-center px-3 animate-pulse">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={12} /> EMERGENCY BROADCAST
                      </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4 text-center bg-gradient-to-b from-black to-red-950/30">
                      <p className="text-white font-bold text-sm md:text-base leading-tight uppercase tracking-wide break-words" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                        {broadcastMessage || "EMERGENCY ALERT MESSAGE WILL APPEAR HERE..."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comms & Authority Hub */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-low rounded-xl p-6 shadow-[0px_20px_40px_rgba(0,219,233,0.06)] flex flex-col border border-white/5">
          <h3 className="font-label text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Direct Comms Hub</h3>
          
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setActiveCommChannel('police')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${activeCommChannel === 'police' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-slate-400 hover:bg-surface-container-high'}`}
            >
              Police
            </button>
            <button 
              onClick={() => setActiveCommChannel('emt')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${activeCommChannel === 'emt' ? 'bg-tertiary-fixed-dim text-black' : 'bg-surface-container text-slate-400 hover:bg-surface-container-high'}`}
            >
              EMT
            </button>
            <button 
              onClick={() => setActiveCommChannel('fire')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${activeCommChannel === 'fire' ? 'bg-error text-white' : 'bg-surface-container text-slate-400 hover:bg-surface-container-high'}`}
            >
              Fire
            </button>
          </div>

          <div className="flex-1 bg-surface-container rounded-xl p-4 flex flex-col border border-white/5">
            {activeCommChannel === 'police' && (
              <>
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary-container">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-none">City Police Dispatch</p>
                      <p className="text-[10px] text-secondary-fixed mt-1">CONNECTED - ENCRYPTED</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-surface-container-high text-slate-400 hover:text-white transition-colors">
                      <Phone size={16} />
                    </button>
                    <button className="p-2 rounded-lg bg-primary-container/20 text-primary-container hover:bg-primary-container/30 transition-colors">
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto mb-4">
                  {policeMessages.map((msg, idx) => (
                    <div key={idx} className={msg.sender === 'me' ? "bg-primary-container/10 border border-primary-container/20 p-3 rounded-xl rounded-tr-none self-end max-w-[80%]" : "bg-surface-container-high p-3 rounded-xl rounded-tl-none self-start max-w-[80%]"}>
                      <p className={`text-xs ${msg.sender === 'me' ? 'text-primary-container' : 'text-slate-300'}`}>{msg.text}</p>
                      <span className={`text-[8px] mt-1 block ${msg.sender === 'me' ? 'text-primary-container/50 text-right' : 'text-slate-500'}`}>{msg.time}</span>
                    </div>
                  ))}
                </div>
                <div className="relative mt-auto">
                  <input 
                    type="text" 
                    placeholder="Type secure message..." 
                    className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl py-2 pl-3 pr-10 text-xs text-slate-300 focus:outline-none focus:border-primary-container/50" 
                    value={policeInput}
                    onChange={(e) => setPoliceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendPoliceMessage();
                    }}
                  />
                  <button 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-container hover:text-primary-container/80"
                    onClick={handleSendPoliceMessage}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </>
            )}
            {activeCommChannel === 'emt' && (
              <>
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-tertiary-fixed-dim">
                      <HeartPulse size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-none">EMT Command Unit 4</p>
                      <p className="text-[10px] text-secondary-fixed mt-1">ON-SITE ACTIVE</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim hover:bg-tertiary-fixed-dim/30 transition-colors">
                      <Mic size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-surface-container-highest flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-2 border-tertiary-fixed-dim/30 animate-ping"></div>
                    <Mic size={32} className="text-tertiary-fixed-dim" />
                  </div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Voice Channel Open</p>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-3 bg-tertiary-fixed-dim rounded-full animate-pulse"></div>
                    <div className="w-1 h-5 bg-tertiary-fixed-dim rounded-full animate-pulse delay-75"></div>
                    <div className="w-1 h-8 bg-tertiary-fixed-dim rounded-full animate-pulse delay-150"></div>
                    <div className="w-1 h-4 bg-tertiary-fixed-dim rounded-full animate-pulse delay-200"></div>
                    <div className="w-1 h-6 bg-tertiary-fixed-dim rounded-full animate-pulse delay-300"></div>
                  </div>
                </div>
              </>
            )}
            {activeCommChannel === 'fire' && (
              <>
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                      <Flame size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-none">Fire & Rescue</p>
                      <p className="text-[10px] text-slate-500 mt-1">STANDBY MODE</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4">
                  <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-2">
                    <AlertTriangle size={24} />
                  </div>
                  <p className="text-sm text-white font-bold">Emergency Line</p>
                  <p className="text-xs text-slate-400">Initiate a direct priority call to the municipal fire department. This action will log an official incident report.</p>
                  <button className="mt-4 px-6 py-3 rounded-xl bg-error text-on-error text-xs font-black uppercase tracking-widest hover:bg-error/90 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                    Initiate Call
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="bg-surface-container-low rounded-2xl p-5 border border-white/5 flex flex-wrap items-center justify-between gap-6 mt-8 shadow-[0px_20px_40px_rgba(0,0,0,0.2)]">
        <div className="flex flex-wrap gap-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary-fixed/10 rounded-xl text-secondary-fixed">
              <Activity size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">System Latency</span>
              <span className="font-headline text-lg font-bold text-secondary-fixed flex items-center gap-2">
                {telemetry.latency}ms <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse shadow-[0_0_8px_currentColor]"></span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-container/10 rounded-xl text-primary-container">
              <Video size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Camera Feeds</span>
              <span className="font-headline text-lg font-bold text-primary-container">{telemetry.onlineFeeds}<span className="text-sm text-slate-500 font-normal ml-1">/150 Online</span></span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-tertiary-fixed-dim/10 rounded-xl text-tertiary-fixed-dim">
              <Radio size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Staff Comms</span>
              <span className="font-headline text-lg font-bold text-tertiary-fixed-dim">{telemetry.activeComms} Active Groups</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 pl-6 border-l border-outline-variant/20">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Administrator</p>
            <p className="text-sm font-bold text-white tracking-tight">Johnathan V. Rourke</p>
          </div>
          <div className="relative">
            <img 
              className="w-11 h-11 rounded-full border-2 border-primary-container/50 object-cover" 
              alt="Admin" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaGPEeXrC-sYvH7lCYk7R9z2hyJd0czWEgYoyN2GQU4OKdmnoOybAadsCoydj_Fu3MhMcrtVWSRkvvt22vIxVS6X52mi_mAMFr_53V_frPVOADeVHKkj36li3Y5WWA801xZ6jtSm76LlbjzDZz7HhnyYw7AG2zM5w4qAmE6h0m2WYG88ylvne7_ypq6pcbPQlHwh6G0ddF4hlmvsSCEgtGXSbrYIf3yGemnx4nn12ln1MI-2iNgKh-MEUUiAc59ttQ7cC3PoPlHCfa"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-secondary-fixed border-2 border-surface-container-low rounded-full shadow-[0_0_8px_currentColor]"></span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Emergency;
