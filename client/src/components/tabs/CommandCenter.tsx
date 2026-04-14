import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, UserX, Unlock, Megaphone, Bot, CloudRain, Coffee, Wind, Clock, Activity, Droplets, CheckCircle2, ChevronRight, Video, Users, X, Shield, HeartPulse, Flame, Send } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { AnimatePresence, motion } from 'motion/react';
import { Responder, TelemetryData } from '../../types';

interface CommandCenterProps {
  responders?: Responder[];
  telemetry: TelemetryData;
  onOpenRoster?: () => void;
  onDispatchUnit?: (unitId: string, location: string) => void;
  onBroadcastMessage?: (message: string) => void;
}

const CommandCenter = React.memo(function CommandCenter({ 
  responders = [], 
  telemetry, 
  onOpenRoster,
  onDispatchUnit,
  onBroadcastMessage
}: CommandCenterProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);
  
  const [weatherAlert, setWeatherAlert] = useState<{title: string, message: string, type: 'rain' | 'wind'} | null>(null);
  const prevWeatherRef = useRef(telemetry.weather);

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  useEffect(() => {
    const prev = prevWeatherRef.current;
    if (telemetry.weather.precip > 80 && prev.precip <= 80) {
      setWeatherAlert({
        title: "SEVERE WEATHER ALERT",
        message: "Sudden downpour detected. Outdoor concourses may become slippery. Redirecting flow recommended.",
        type: "rain"
      });
    } else if (telemetry.weather.wind > 25 && prev.wind <= 25) {
      setWeatherAlert({
        title: "HIGH WIND WARNING",
        message: "Wind speeds exceeding 25km/h. Secure loose equipment in open areas.",
        type: "wind"
      });
    }
    prevWeatherRef.current = telemetry.weather;
  }, [telemetry.weather]);

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {telemetry.weather.condition === 'Severe Storm' && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="p-4 rounded-xl border-l-4 shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-start gap-4 bg-error/20 border-error text-error animate-pulse"
          >
            <div className="mt-1">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-bold uppercase tracking-wider text-error">CRISIS MODE: SEVERE WEATHER EVACUATION</h4>
              </div>
              <p className="text-sm mt-1 opacity-90 text-white">Mandatory evacuation protocol is active. All units redeploying to interior concourses. Gate flows reversed to egress.</p>
            </div>
          </motion.div>
        )}
        {weatherAlert && telemetry.weather.condition !== 'Severe Storm' && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            role="alert"
            aria-live="polite"
            className={`p-4 rounded-xl border-l-4 shadow-lg flex items-start gap-4 ${
              weatherAlert.type === 'rain' 
                ? 'bg-secondary-fixed/10 border-secondary-fixed text-secondary-fixed' 
                : 'bg-orange-500/10 border-orange-500 text-orange-500'
            }`}
          >
            <div className="mt-1">
              {weatherAlert.type === 'rain' ? <CloudRain size={24} /> : <Wind size={24} />}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-bold uppercase tracking-wider">{weatherAlert.title}</h4>
                <button 
                  onClick={() => setWeatherAlert(null)}
                  aria-label="Close weather alert"
                  className="opacity-70 hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm mt-1 opacity-90">{weatherAlert.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column (Map & Metrics) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Map Area */}
          <div className="bg-surface-container-low rounded-3xl overflow-hidden relative flex-1 min-h-[500px] shadow-[0px_20px_40px_rgba(0,219,233,0.06)] border border-outline-variant/10">
            <div className="absolute inset-0 z-0">
              <img
                src="/stadium_map.png"
                alt="Stadium Blueprint"
                className="w-full h-full object-cover opacity-40 grayscale mix-blend-screen"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-80"></div>
            
            {/* Map Controls */}
            <div className="absolute top-6 left-6 z-10 flex gap-3">
              <div className="glass-panel px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white border border-white/10">
                Layer: Density Map
              </div>
              <div className="glass-panel px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-primary-container border border-primary-container/20">
                Scale: 1:500
              </div>
            </div>

            {/* Density Scale */}
            <div className="absolute bottom-6 right-6 z-10">
              <div className="flex items-center gap-3 glass-panel p-3 rounded-2xl border border-white/5">
                <div className="w-32 h-2 bg-gradient-to-r from-secondary-fixed via-tertiary-fixed-dim to-error rounded-full"></div>
                <span className="text-[10px] font-bold uppercase text-slate-300">Density Scale</span>
              </div>
            </div>

            {/* Heatmap Blobs & Interactive Hotspots */}
            <div className="absolute inset-0 z-10">
              <div className="relative w-full h-full">
                {/* Hotspot 1: Gate C */}
                <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-error/40 blur-[40px] rounded-full animate-pulse pointer-events-none"></div>
                <div 
                  className={`absolute top-1/4 left-1/3 w-8 h-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 transition-all ${selectedItems.includes('gate-c') ? 'scale-125' : ''}`}
                  onMouseEnter={() => setActiveTooltip('gate-c')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={(e) => toggleSelection(e, 'gate-c')}
                >
                  <div className={`w-full h-full rounded-full border flex items-center justify-center transition-colors ${selectedItems.includes('gate-c') ? 'bg-error/40 border-error shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-error/20 border-error/50'}`}>
                    <div className="w-2 h-2 bg-error rounded-full"></div>
                  </div>
                  {/* Tooltip */}
                  {activeTooltip === 'gate-c' && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-surface-container-high/95 backdrop-blur-md border border-error/30 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={14} className="text-error" />
                        <span className="text-[10px] font-bold uppercase text-error tracking-wider">Gate C Overcrowd</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Density</span>
                          <span className="text-white font-bold">98%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Flow Rate</span>
                          <span className="text-error font-bold">12/min</span>
                        </div>
                        <button className="w-full mt-2 py-1.5 bg-surface-container text-[10px] font-bold text-white uppercase rounded flex items-center justify-center gap-1 hover:bg-surface-container-highest transition-colors">
                          <Video size={12} /> View Camera 4
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hotspot 2: Concourse B */}
                <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-tertiary-fixed-dim/20 blur-[60px] rounded-full pointer-events-none"></div>
                <div 
                  className={`absolute top-1/2 right-1/4 w-8 h-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 transition-all ${selectedItems.includes('concourse-b') ? 'scale-125' : ''}`}
                  onMouseEnter={() => setActiveTooltip('concourse-b')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={(e) => toggleSelection(e, 'concourse-b')}
                >
                  <div className={`w-full h-full rounded-full border flex items-center justify-center transition-colors ${selectedItems.includes('concourse-b') ? 'bg-tertiary-fixed-dim/40 border-tertiary-fixed-dim shadow-[0_0_15px_rgba(251,188,4,0.8)]' : 'bg-tertiary-fixed-dim/20 border-tertiary-fixed-dim/50'}`}>
                    <div className="w-2 h-2 bg-tertiary-fixed-dim rounded-full"></div>
                  </div>
                  {/* Tooltip */}
                  {activeTooltip === 'concourse-b' && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-surface-container-high/95 backdrop-blur-md border border-tertiary-fixed-dim/30 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                      <div className="flex items-center gap-2 mb-2">
                        <Users size={14} className="text-tertiary-fixed-dim" />
                        <span className="text-[10px] font-bold uppercase text-tertiary-fixed-dim tracking-wider">Concourse B</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Density</span>
                          <span className="text-white font-bold">75%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Wait Time</span>
                          <span className="text-tertiary-fixed-dim font-bold">18m</span>
                        </div>
                        <button className="w-full mt-2 py-1.5 bg-surface-container text-[10px] font-bold text-white uppercase rounded flex items-center justify-center gap-1 hover:bg-surface-container-highest transition-colors">
                          <Video size={12} /> View Camera 12
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hotspot 3: South Plaza */}
                <div className="absolute bottom-1/4 left-1/2 w-40 h-40 bg-secondary-fixed/20 blur-[50px] rounded-full pointer-events-none"></div>
                <div 
                  className={`absolute bottom-1/4 left-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 transition-all ${selectedItems.includes('south-plaza') ? 'scale-125' : ''}`}
                  onMouseEnter={() => setActiveTooltip('south-plaza')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={(e) => toggleSelection(e, 'south-plaza')}
                >
                  <div className={`w-full h-full rounded-full border flex items-center justify-center transition-colors ${selectedItems.includes('south-plaza') ? 'bg-secondary-fixed/40 border-secondary-fixed shadow-[0_0_15px_rgba(121,255,91,0.8)]' : 'bg-secondary-fixed/20 border-secondary-fixed/50'}`}>
                    <div className="w-2 h-2 bg-secondary-fixed rounded-full"></div>
                  </div>
                  {/* Tooltip */}
                  {activeTooltip === 'south-plaza' && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-surface-container-high/95 backdrop-blur-md border border-secondary-fixed/30 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 size={14} className="text-secondary-fixed" />
                        <span className="text-[10px] font-bold uppercase text-secondary-fixed tracking-wider">South Plaza</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Density</span>
                          <span className="text-white font-bold">32%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Flow Rate</span>
                          <span className="text-secondary-fixed font-bold">85/min</span>
                        </div>
                        <button className="w-full mt-2 py-1.5 bg-surface-container text-[10px] font-bold text-white uppercase rounded flex items-center justify-center gap-1 hover:bg-surface-container-highest transition-colors">
                          <Video size={12} /> View Camera 2
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Responders Layer */}
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
                      className={`absolute flex flex-col items-center cursor-pointer pointer-events-auto z-30 transition-all duration-1000 ease-linear ${selectedItems.includes(unit.id) ? 'scale-125 z-40' : ''}`}
                      style={{ top: `${unit.top}%`, left: `${unit.left}%`, transform: 'translate(-50%, -50%)' }}
                      onMouseEnter={() => setActiveTooltip(unit.id)}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={(e) => toggleSelection(e, unit.id)}
                    >
                      <div className="relative flex items-center justify-center">
                        {unit.status === 'On Scene' && (
                          <div className={`absolute inset-0 ${colorClass} rounded-full animate-ping opacity-75`}></div>
                        )}
                        <div className={`relative w-4 h-4 ${colorClass} rounded-full border-2 ${selectedItems.includes(unit.id) ? 'border-primary-container' : 'border-white'} ${shadowClass} flex items-center justify-center text-surface-container-lowest transition-colors`}>
                          <Icon size={8} />
                        </div>
                      </div>
                      
                      {activeTooltip === unit.id && (
                        <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-surface-container-high/95 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Icon size={12} className={textClass} />
                            <span className={`text-[10px] font-bold uppercase ${textClass} tracking-wider`}>{unit.name}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400">Status</span>
                            <span className="text-white font-bold">{unit.status}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Floating Action Bar for Multiple Selection */}
            <AnimatePresence>
              {selectedItems.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface-container-highest/90 backdrop-blur-md border border-outline-variant/30 rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl"
                >
                  <span className="text-xs font-bold text-white bg-white/10 px-3 py-1 rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
                    {selectedItems.length} Selected
                  </span>
                  <div className="w-px h-4 bg-white/10"></div>
                  <button 
                    className="text-[10px] font-bold uppercase tracking-wider text-primary-container hover:text-primary hover:bg-primary-container/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    onClick={() => {
                      if (onDispatchUnit) {
                        selectedItems.forEach(id => {
                          if (id.startsWith('u-') || id.startsWith('emt-') || id.startsWith('fire-')) {
                            onDispatchUnit(id, 'Selected Hotspot');
                          }
                        });
                      }
                      setSelectedItems([]);
                    }}
                  >
                    <Send size={14} /> Dispatch Units
                  </button>
                  <button 
                    className="text-[10px] font-bold uppercase tracking-wider text-tertiary-fixed-dim hover:text-tertiary-fixed hover:bg-tertiary-fixed-dim/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    onClick={() => {
                      if (onBroadcastMessage) {
                        onBroadcastMessage(`Attention: Bulk action initiated for ${selectedItems.join(', ')}.`);
                      }
                      setSelectedItems([]);
                    }}
                  >
                    <Megaphone size={14} /> Broadcast
                  </button>
                  <div className="w-px h-4 bg-white/10"></div>
                  <button 
                    className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors" 
                    onClick={() => setSelectedItems([])}
                    aria-label="Clear selection"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-container rounded-2xl p-5 border-l-4 border-primary-container hover:-translate-y-1 transition-transform duration-300">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Attendance</p>
              <h4 className="font-headline text-3xl font-bold text-white">{telemetry.attendance.toLocaleString()}</h4>
              <p className="text-[10px] text-secondary-fixed mt-1 flex items-center gap-1">
                <TrendingUp size={12} />
                +12% vs last match
              </p>
            </div>
            <div className="bg-surface-container rounded-2xl p-5 hover:-translate-y-1 transition-transform duration-300">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Avg Wait Time</p>
              <h4 className="font-headline text-3xl font-bold text-white">{telemetry.avgWaitTime.toFixed(1)}m</h4>
              <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                <TrendingDown size={12} />
                Slow at Gate B
              </p>
            </div>
            <div className="bg-surface-container rounded-2xl p-5 hover:-translate-y-1 transition-transform duration-300">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Active Incidents</p>
              <h4 className="font-headline text-3xl font-bold text-error">{telemetry.activeIncidents.toString().padStart(2, '0')}</h4>
              <p className="text-[10px] text-slate-400 mt-1 uppercase">Resolving (Stage 2)</p>
            </div>
            <div className="bg-surface-container rounded-2xl p-5 hover:-translate-y-1 transition-transform duration-300">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Gate Throughput</p>
              <h4 className="font-headline text-3xl font-bold text-white">
                {telemetry.gateThroughput}<span className="text-sm font-normal text-slate-500 ml-1">/min</span>
              </h4>
              <p className="text-[10px] text-secondary-fixed mt-1 uppercase">Optimal flow</p>
            </div>
          </div>
        </div>

        {/* Right Column (Staff & Emergency) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Live Weather Detection */}
          <section className="glass-panel rounded-3xl p-6 border border-white/5 bg-surface-container-low/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline text-lg font-bold text-white tracking-tight uppercase flex items-center gap-2">
                <CloudRain size={20} className="text-primary-container" />
                Live Weather
              </h3>
              <span className="text-[10px] font-bold text-primary-container bg-primary-container/10 px-2 py-1 rounded animate-pulse">
                DETECTING
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-high/40 p-3 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Condition</p>
                <div className="flex items-center gap-2">
                  <CloudRain size={16} className="text-primary-container" />
                  <span className="text-sm font-bold text-white">{telemetry.weather.condition}</span>
                </div>
              </div>
              <div className="bg-surface-container-high/40 p-3 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Temperature</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{telemetry.weather.temp.toFixed(1)}°C</span>
                </div>
              </div>
              <div className="bg-surface-container-high/40 p-3 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Wind Speed</p>
                <div className="flex items-center gap-2">
                  <Wind size={16} className="text-tertiary-fixed-dim" />
                  <span className="text-sm font-bold text-white">{telemetry.weather.wind.toFixed(1)} km/h</span>
                </div>
              </div>
              <div className="bg-surface-container-high/40 p-3 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Precipitation</p>
                <div className="flex items-center gap-2">
                  <Droplets size={16} className="text-primary-container" />
                  <span className="text-sm font-bold text-white">{telemetry.weather.precip}%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Staff Coordination */}
          <section className="glass-panel rounded-3xl p-6 border border-white/5 bg-surface-container-low/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline text-lg font-bold text-white tracking-tight uppercase">
                Staff Coordination
              </h3>
              <span className="text-[10px] font-bold text-primary-container bg-primary-container/10 px-2 py-1 rounded">
                LIVE
              </span>
            </div>
            <div className="space-y-4">
              {[
                {
                  name: 'Unit Alpha-09',
                  sector: 'North Plaza',
                  status: 'bg-secondary-fixed',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoLRNIKQYjla6LjjUeo76rOFQNKSDiKwhEzRMPpwUnf4_Ah65r7oTvQBr-wWN_jUbB1kTVOf_qduLXqABpyuBlKJAXa9AngylJu2KHjkhkPt8C0frhYr10mciYKKrMs2j7Oy2CDSYR7BQVOmh7QEYPDmUkY8-fLZna7D82_--2-VzZdLEKNpAo2GekXYwRAhjHS6QLI550jCVp8kr5dg-3mMUTtCPIMVHb6hlNqtOcwzAH9N4RDkXBfYb1u4VWjr-wj-k647wuxZRO',
                },
                {
                  name: 'Unit Gamma-14',
                  sector: 'Gate B Crowds',
                  status: 'bg-tertiary-fixed-dim',
                  border: 'border-l-2 border-tertiary-fixed-dim',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5c9PRbIXmMJ5P8ETIk7OJnGRLo5MorVr39esSMloPHCDi2G6cRuLKIOzY_LV13ikc2ab24Dk9xIbpbzd5o_dFE1sRTdcheMoSR7wTntFcCV7032and1cRAyqL4zZxO836C4o4UmUWlgOaNxP42kRt6ZBYtVIULsB9qn8qMjJ-__h5TmIEu3ZfcVw8cuz3426jFIpRLIerLTRtTCahO9EdJsR-RqgSuczIN6QORL56EwW-QKv0NyngmCgsDR1qmY1c56jGYtxheFbF',
                },
                {
                  name: 'Medic-03',
                  sector: 'Concourse 2',
                  status: 'bg-secondary-fixed',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKkvH73dOz6MUCAHuKILiyDK9w-AjtY7NTIE_bNkq9ku-JLbnDPsehhXDeKSE_dj1C0Epaf3rQvCjJrRRgaoC9iCHwSsBuaB-fQDGAJA6lusmnyGN85X9A40UPmYMYDIXkOSCiRT45Ih5NZkZ4l3MKq4Qx0efyTuNDalQHuK2a65faiYTIZmeGqTgCyXzUwgUT4OYuEB5Vwqk4uQXSOratR0W_N6uvuYSi-XPSTrUE01oeB-L0gQa2X1P2LDByZxAgVuiTx7parhcF',
                },
              ].map((staff, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 bg-surface-container-high/40 rounded-2xl ${
                    staff.border || ''
                  } hover:bg-surface-container-high transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container overflow-hidden">
                      <img src={staff.img} alt={staff.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{staff.name}</p>
                      <p className="text-[10px] text-slate-400">Sector: {staff.sector}</p>
                    </div>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${staff.status} shadow-[0_0_8px_currentColor]`}></span>
                </div>
              ))}
            </div>
            <button 
              onClick={onOpenRoster}
              className="w-full mt-6 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-bold rounded-xl active:scale-95 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]"
            >
              <Shield size={16} className="fill-current" />
              View Roster
            </button>
          </section>

          {/* Emergency Protocols */}
          <section className="bg-surface-container-low rounded-3xl p-6 border-t border-error/20 shadow-lg">
            <div className="flex items-center gap-3 mb-6 text-error">
              <AlertTriangle size={20} className="fill-current animate-pulse" />
              <h3 className="font-headline text-lg font-bold tracking-tight uppercase">
                Emergency Protocols
              </h3>
            </div>
            <div className="space-y-4">
              <button 
                onClick={() => setActiveProtocol('dispersal')}
                className="group relative w-full p-4 bg-gradient-to-r from-error/20 to-error/5 hover:from-error/30 hover:to-error/10 border border-error/30 rounded-2xl transition-all flex items-center justify-between overflow-hidden active:scale-[0.98]"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error shadow-[0_0_10px_rgba(255,84,73,0.8)]"></div>
                <div className="flex items-center gap-4 ml-2">
                  <div className="p-2 bg-error/20 rounded-lg text-error group-hover:scale-110 transition-transform shrink-0">
                    <UserX size={20} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-error uppercase tracking-widest block mb-0.5">Trigger Dispersal Map</span>
                    <span className="text-[10px] text-error/70 leading-tight block">Initiate automated crowd rerouting to secondary exits.</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-error/50 group-hover:text-error group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </button>

              <button 
                onClick={() => setActiveProtocol('unlock')}
                className="group relative w-full p-4 bg-gradient-to-r from-tertiary-fixed-dim/20 to-tertiary-fixed-dim/5 hover:from-tertiary-fixed-dim/30 hover:to-tertiary-fixed-dim/10 border border-tertiary-fixed-dim/30 rounded-2xl transition-all flex items-center justify-between overflow-hidden active:scale-[0.98]"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary-fixed-dim shadow-[0_0_10px_rgba(255,180,100,0.8)]"></div>
                <div className="flex items-center gap-4 ml-2">
                  <div className="p-2 bg-tertiary-fixed-dim/20 rounded-lg text-tertiary-fixed-dim group-hover:scale-110 transition-transform shrink-0">
                    <Unlock size={20} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-tertiary-fixed-dim uppercase tracking-widest block mb-0.5">Unlock Egress Gate C</span>
                    <span className="text-[10px] text-tertiary-fixed-dim/70 leading-tight block">Override magnetic locks for immediate evacuation.</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-tertiary-fixed-dim/50 group-hover:text-tertiary-fixed-dim group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </button>

              <button 
                onClick={() => setActiveProtocol('broadcast')}
                className="group relative w-full p-4 bg-gradient-to-r from-primary-container/20 to-primary-container/5 hover:from-primary-container/30 hover:to-primary-container/10 border border-primary-container/30 rounded-2xl transition-all flex items-center justify-between overflow-hidden active:scale-[0.98]"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-container shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>
                <div className="flex items-center gap-4 ml-2">
                  <div className="p-2 bg-primary-container/20 rounded-lg text-primary-container group-hover:scale-110 transition-transform shrink-0">
                    <Megaphone size={20} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-primary-container uppercase tracking-widest block mb-0.5">Broadcast Alert</span>
                    <span className="text-[10px] text-primary-container/70 leading-tight block">Override PA system with evacuation instructions.</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-primary-container/50 group-hover:text-primary-container group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Row (Trends, Distribution, Facilities, AI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Entry Flow Trends */}
        <div className="bg-surface-container rounded-3xl p-6 overflow-hidden relative group flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 blur-3xl rounded-full"></div>
          <h5 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4">
            Entry Flow Trends
          </h5>
          <div className="flex-1 w-full min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={telemetry.flowData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {telemetry.flowData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 3 ? '#00f0ff' : '#262a34'}
                      className="transition-all duration-300 hover:fill-primary-container/60"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Distribution */}
        <div className="bg-surface-container rounded-3xl p-6 flex flex-col items-center justify-center">
          <h5 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4 w-full text-left">
            Sector Distribution
          </h5>
          <div className="relative w-24 h-24 mx-auto mb-2">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                className="text-surface-container-high"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * telemetry.sectorDist) / 100}
                strokeLinecap="round"
                className="text-primary-container drop-shadow-[0_0_8px_rgba(0,240,255,0.5)] transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-headline font-bold text-white">{telemetry.sectorDist}%</span>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 uppercase tracking-tighter">
            Main Bowl Capacity Reached
          </p>
        </div>

        {/* Facilities Status */}
        <div className="bg-surface-container rounded-3xl p-6 flex flex-col">
          <h5 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4">
            Facilities Wait Times
          </h5>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-300 flex items-center gap-2"><Coffee size={14} className="text-slate-500"/> Concession A</span>
              <span className="text-xs font-bold text-error bg-error/10 px-2 py-1 rounded">{telemetry.waits.ca}m wait</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-300 flex items-center gap-2"><Coffee size={14} className="text-slate-500"/> Concession B</span>
              <span className="text-xs font-bold text-tertiary-fixed-dim bg-tertiary-fixed-dim/10 px-2 py-1 rounded">{telemetry.waits.cb}m wait</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-300 flex items-center gap-2"><Droplets size={14} className="text-slate-500"/> Restrooms (North)</span>
              <span className="text-xs font-bold text-secondary-fixed bg-secondary-fixed/10 px-2 py-1 rounded">{telemetry.waits.rn}m wait</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-300 flex items-center gap-2"><Droplets size={14} className="text-slate-500"/> Restrooms (South)</span>
              <span className="text-xs font-bold text-error bg-error/10 px-2 py-1 rounded">{telemetry.waits.rs}m wait</span>
            </div>
          </div>
        </div>

        {/* AI Prediction */}
        <div className="bg-surface-container rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-container/10 rounded-full blur-2xl"></div>
          <div>
            <h5 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4">
              AI Prediction
            </h5>
            <div className="bg-surface-container-high/50 p-4 rounded-2xl border border-white/5">
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "Congestion likely at Gate B in T-minus 12 minutes. Recommend redirecting overflow to North Access."
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-primary-container bg-primary-container/10 w-fit px-3 py-1.5 rounded-lg border border-primary-container/20">
            <Bot size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Neural Core Active</span>
          </div>
        </div>
      </div>

      {/* Live Operations Feed */}
      <div className="bg-surface-container-low rounded-3xl p-6 border border-white/5 shadow-[0px_20px_40px_rgba(0,0,0,0.2)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline text-lg font-bold text-white tracking-tight uppercase flex items-center gap-2">
            <Activity size={20} className="text-primary-container" />
            Live Operations Feed
          </h3>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowAlertsModal(true)}
              className="text-[10px] font-bold text-error hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              <AlertTriangle size={12} /> View Active Alerts ({telemetry.activeAlerts?.length || 0})
            </button>
            <button className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors">
              View Full Audit Log
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container p-4 rounded-2xl flex gap-4 items-start">
            <div className="bg-primary-container/20 p-2 rounded-xl text-primary-container shrink-0">
              <Unlock size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white mb-1">Gate C Turnstiles Unlocked</p>
              <p className="text-[10px] text-slate-400">Authorized by Admin • System overridden to ease congestion.</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-2 flex items-center gap-1"><Clock size={10}/> 2 mins ago</p>
            </div>
          </div>
          <div className="bg-surface-container p-4 rounded-2xl flex gap-4 items-start">
            <div className="bg-secondary-fixed/20 p-2 rounded-xl text-secondary-fixed shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white mb-1">Medical Incident Resolved</p>
              <p className="text-[10px] text-slate-400">Sector 102 • EMT Unit 04 reports patient stabilized and moved.</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-2 flex items-center gap-1"><Clock size={10}/> 14 mins ago</p>
            </div>
          </div>
          <div className="bg-surface-container p-4 rounded-2xl flex gap-4 items-start">
            <div className="bg-tertiary-fixed-dim/20 p-2 rounded-xl text-tertiary-fixed-dim shrink-0">
              <Megaphone size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white mb-1">Automated PA Announcement</p>
              <p className="text-[10px] text-slate-400">Zone B • "Please have tickets ready" broadcasted to queue.</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-2 flex items-center gap-1"><Clock size={10}/> 22 mins ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts Modal */}
      {showAlertsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a1c23] border border-white/5 rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline text-2xl font-bold text-white tracking-tight uppercase flex items-center gap-2">
                <AlertTriangle className="text-error" size={24} />
                Detailed Active Alerts
              </h2>
              <button 
                onClick={() => setShowAlertsModal(false)}
                aria-label="Close alerts modal"
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl border-l-4 bg-[#2a2425] border-[#ff8a80] flex items-start gap-4">
                <div className="mt-1">
                  <AlertTriangle size={20} className="text-[#ff8a80]" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold uppercase tracking-wider text-[#ff8a80]">Overcrowding Event</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">02:45m ago</span>
                  </div>
                  <p className="text-sm mt-1 text-slate-300">Gate C capacity exceeded by 24%.</p>
                  <div className="mt-4 flex gap-3">
                    <button className="px-4 py-2 bg-[#252730] hover:bg-[#2f313a] text-white text-[10px] font-bold uppercase rounded-lg transition-colors">
                      View Cameras
                    </button>
                    <button className="px-4 py-2 bg-[#252730] hover:bg-[#2f313a] text-white text-[10px] font-bold uppercase rounded-lg transition-colors">
                      Dispatch Unit
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border-l-4 bg-[#2f2216] border-[#ff6d00] flex items-start gap-4">
                <div className="mt-1">
                  <AlertTriangle size={20} className="text-[#ff6d00]" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold uppercase tracking-wider text-[#ff6d00]">Medical Emergency</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">08:12m ago</span>
                  </div>
                  <p className="text-sm mt-1 text-slate-300">Sector 102 - Row J. Fainting reported.</p>
                  <div className="mt-4 flex gap-3">
                    <button className="px-4 py-2 bg-[#252730] hover:bg-[#2f313a] text-white text-[10px] font-bold uppercase rounded-lg transition-colors">
                      View Cameras
                    </button>
                    <button className="px-4 py-2 bg-[#252730] hover:bg-[#2f313a] text-white text-[10px] font-bold uppercase rounded-lg transition-colors">
                      Dispatch Unit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Protocol Modal */}
      {activeProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-low border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline text-xl font-bold text-white tracking-tight uppercase flex items-center gap-2">
                {activeProtocol === 'dispersal' && <><UserX className="text-error" size={24} /> Confirm Dispersal</>}
                {activeProtocol === 'unlock' && <><Unlock className="text-tertiary-fixed-dim" size={24} /> Confirm Unlock</>}
                {activeProtocol === 'broadcast' && <><Megaphone className="text-primary-container" size={24} /> Confirm Broadcast</>}
              </h2>
              <button 
                onClick={() => setActiveProtocol(null)}
                aria-label="Close protocol modal"
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-sm text-slate-300 leading-relaxed">
                {activeProtocol === 'dispersal' && "You are about to initiate the automated crowd rerouting protocol. This will update digital signage and push notifications to staff devices to redirect attendees to secondary exits."}
                {activeProtocol === 'unlock' && "You are about to override the magnetic locks for Egress Gate C. This action is logged and should only be used for immediate evacuation purposes."}
                {activeProtocol === 'broadcast' && "You are about to override the PA system. Please ensure your microphone is connected and ready before proceeding."}
              </p>
              
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-white/5">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Authorization Required</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container">
                    <Shield size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Command Center Admin</p>
                    <p className="text-[10px] text-slate-400">Level 4 Clearance</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setActiveProtocol(null)}
                className="flex-1 py-3 border border-outline-variant/30 text-white text-xs font-bold uppercase rounded-xl hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  // Simulate action
                  setActiveProtocol(null);
                  // Could add a toast notification here
                }}
                className={`flex-1 py-3 text-surface-container-lowest text-xs font-bold uppercase rounded-xl transition-colors ${
                  activeProtocol === 'dispersal' ? 'bg-error hover:bg-error/90' :
                  activeProtocol === 'unlock' ? 'bg-tertiary-fixed-dim hover:bg-tertiary-fixed-dim/90' :
                  'bg-primary-container hover:bg-primary-container/90'
                }`}
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CommandCenter;
