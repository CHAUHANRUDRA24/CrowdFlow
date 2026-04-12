import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Brain, Send, HeartPulse, Activity, CheckCircle2, Loader2, Shield, Flame } from 'lucide-react';
import { Responder, TelemetryData } from '../../types';

interface StaffingProps {
  responders?: Responder[];
  telemetry: TelemetryData;
}

const Staffing = React.memo(function Staffing({ responders = [], telemetry }: StaffingProps) {
  const [executeState, setExecuteState] = useState<'idle' | 'executing' | 'completed' | 'dismissed'>('idle');
  const [rotationState, setRotationState] = useState<'idle' | 'scheduling' | 'completed' | 'dismissed'>('idle');
  
  const [prioritySuggestion, setPrioritySuggestion] = useState('Redeploy 2 units from East Concourse to Gate B Tunnel.');
  const [optimizationSuggestion, setOptimizationSuggestion] = useState('Unit u-7 showing elevated fatigue (88%). Recommend rotation.');

  const respondersRef = useRef(responders);
  useEffect(() => {
    respondersRef.current = responders;
  }, [responders]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Update optimization suggestion if someone is very fatigued
      let maxFatigue = 0;
      let maxFatigueUnit = '';
      
      Object.keys(telemetry.units).forEach(key => {
        if (telemetry.units[key].fat > maxFatigue) {
          maxFatigue = telemetry.units[key].fat;
          maxFatigueUnit = key;
        }
      });

      if (maxFatigue > 75 && maxFatigueUnit) {
        const unitName = respondersRef.current.find(r => r.id === maxFatigueUnit)?.name || maxFatigueUnit;
        setOptimizationSuggestion(`Unit ${unitName} showing elevated fatigue (${maxFatigue.toFixed(0)}%). Recommend rotation.`);
      }

      // Update priority suggestion based on active incidents
      if (telemetry.weather.condition === 'Severe Storm') {
        setPrioritySuggestion('SEVERE WEATHER: Redeploying all exterior perimeter units to interior concourse choke points.');
      } else {
        const patrolUnits = respondersRef.current.filter(r => r.status === 'Patrol');
        const busyUnits = respondersRef.current.filter(r => r.status === 'On Scene' || r.status === 'En Route');
        
        if (patrolUnits.length > 0 && busyUnits.length > 0) {
           const patrol = patrolUnits[Math.floor(Math.random() * patrolUnits.length)];
           const busy = busyUnits[Math.floor(Math.random() * busyUnits.length)];
           setPrioritySuggestion(`Redeploy ${patrol.name} to assist ${busy.name} at active incident location.`);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [responders.length, telemetry.units, telemetry.weather.condition]);

  return (
    <div className="space-y-8">
      {/* Stats / Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black font-headline tracking-tighter text-white">STAFFING_MANAGEMENT</h2>
          <p className="text-slate-400 mt-2 max-w-xl text-sm">
            Real-time deployment of tactical personnel across the event perimeter. AI optimization recommends redistribution to <span className="text-tertiary-fixed-dim font-bold">Gate B</span>.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container-low p-4 rounded-xl shadow-[0px_20px_40px_rgba(0,219,233,0.06)] min-w-[140px] border border-outline-variant/10">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Total Units</p>
            <p className="text-2xl font-black font-headline text-primary-container">{responders.length + 137}</p>
          </div>
          <div className="bg-surface-container-low p-4 rounded-xl shadow-[0px_20px_40px_rgba(0,219,233,0.06)] min-w-[140px] border border-outline-variant/10">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Active Flow</p>
            <p className="text-2xl font-black font-headline text-secondary-fixed">{telemetry.activeFlow}%</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Roster Column */}
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          {/* Map Component */}
          <div className="bg-surface-container-low rounded-3xl overflow-hidden relative w-full h-[400px] shadow-[0px_20px_40px_rgba(0,219,233,0.06)] border border-outline-variant/10">
            <div className="absolute inset-0 z-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC96nJKRjm7NQQDo4IE0Kv9eIyzQWfbnV1lqq1252jBJdJS8JZF9P9QZpvxYSli-av1TeVcgmtFJ5riTTv_sbtZ5oZd3Mr_uXx8InWm_IDgh8STRNT28mEpxNm9p3Twk-gjrT11TjP0UGSMTMEg4iHW7ugNio2_zLd-azVUpgXXc1CUgza0nLOe9p1ZFCovdrWENe6C7n1l65U4acZY5lyPzz3QC_PfOh3YM10L9jLMXzpHlCg_qgHb4VLkrzPO3UG3OcciUBjdwqkr"
                alt="Stadium Blueprint"
                className="w-full h-full object-cover opacity-40 grayscale mix-blend-screen"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-80 pointer-events-none"></div>
            
            {/* Responders Layer */}
            <div className="absolute inset-0 z-10">
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
                    className="absolute flex flex-col items-center cursor-pointer pointer-events-auto z-30 transition-all duration-1000 ease-linear"
                    style={{ top: `${unit.top}%`, left: `${unit.left}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="relative flex items-center justify-center">
                      {unit.status === 'On Scene' && (
                        <div className={`absolute inset-0 ${colorClass} rounded-full animate-ping opacity-75`}></div>
                      )}
                      <div className={`relative w-4 h-4 ${colorClass} rounded-full border-2 border-white ${shadowClass} flex items-center justify-center text-surface-container-lowest`}>
                        <Icon size={8} />
                      </div>
                    </div>
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max`}>
                      <span className={`text-[9px] font-bold uppercase ${textClass} tracking-wider bg-surface-container-high/80 px-1.5 py-0.5 rounded backdrop-blur-sm`}>{unit.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Map Overlay Info */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
              <h3 className="text-sm font-bold font-headline tracking-tight text-white drop-shadow-md">LIVE_DEPLOYMENT_MAP</h3>
              <p className="text-[10px] text-slate-300 drop-shadow-md uppercase tracking-widest">Real-time unit tracking</p>
            </div>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
              <h3 className="text-lg font-bold font-headline tracking-tight text-white">TACTICAL_ROSTER</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-surface-container text-[10px] font-bold text-slate-400 border border-outline-variant/20">ALL UNITS</span>
              <span className="px-3 py-1 rounded-full bg-surface-container text-[10px] font-bold text-secondary-fixed border border-secondary-fixed/20">ACTIVE</span>
              <span className="px-3 py-1 rounded-full bg-surface-container text-[10px] font-bold text-tertiary-fixed-dim border border-tertiary-fixed-dim/20">RESPONDING</span>
            </div>
          </div>

          <div className="space-y-3">
            {responders.map(unit => {
              const uData = telemetry.units[unit.id] || { hr: 80, fat: 10 };
              const isResponding = unit.status === 'En Route';
              const isMedical = unit.type === 'medical';
              const isFire = unit.type === 'fire';
              
              let statusColor = 'text-secondary-fixed';
              let statusBg = 'bg-secondary-fixed';
              let statusShadow = 'shadow-[0_0_8px_#79ff5b]';
              let borderClass = 'border-transparent';
              
              if (isResponding) {
                statusColor = 'text-tertiary-fixed-dim';
                statusBg = 'bg-tertiary-fixed-dim';
                statusShadow = 'shadow-[0_0_8px_#fbbc00]';
                borderClass = 'border-l-4 border-l-tertiary-fixed-dim border-y-transparent border-r-transparent';
              } else if (isFire) {
                statusColor = 'text-error';
                statusBg = 'bg-error';
                statusShadow = 'shadow-[0_0_8px_#ef4444]';
              }

              return (
                <div key={unit.id} className={`bg-surface-container hover:bg-surface-container-high transition-all duration-300 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between group border ${borderClass} gap-4`}>
                  <div className="flex items-center gap-6">
                    <div className="text-center min-w-[60px]">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Unit ID</p>
                      <p className="text-lg font-bold font-headline text-primary">{unit.name}</p>
                    </div>
                    <div className="h-10 w-px bg-outline-variant/30 hidden sm:block"></div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Type</p>
                      <p className="text-sm font-semibold text-white capitalize">{unit.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 sm:gap-8 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Biometrics */}
                    <div className="hidden md:block min-w-[100px]">
                      <p className="text-[10px] text-slate-500 uppercase mb-1 font-bold">Biometrics</p>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 ${uData.hr > 120 ? 'text-error' : 'text-secondary-fixed'}`}>
                          <HeartPulse size={12} className="animate-pulse" />
                          <span className="text-xs font-bold">{uData.hr}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${uData.fat > 70 ? 'text-tertiary-fixed-dim' : 'text-slate-300'}`}>
                          <Activity size={12} />
                          <span className="text-xs font-bold">{uData.fat.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase mb-1 font-bold">Status</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusBg} ${statusShadow}`}></span>
                        <span className={`text-xs font-bold ${statusColor}`}>{unit.status}</span>
                      </div>
                    </div>
                    <div className="min-w-[120px] hidden sm:block">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">ETA</p>
                      <p className="text-xs text-slate-300">{unit.eta || 'N/A'}</p>
                    </div>
                    <button className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center sm:opacity-0 group-hover:opacity-100 transition-opacity text-primary-container hover:bg-white/5 shrink-0">
                      <ExternalLink size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </section>

        {/* AI Recommendations Column */}
        <section className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface-container-low rounded-xl p-6 shadow-[0px_20px_40px_rgba(0,219,233,0.06)] border border-white/5">
            <h3 className="font-label text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Brain size={16} className="text-primary-container" />
              AI Deployment Suggestions
            </h3>
            
            <div className="space-y-4">
              {executeState !== 'dismissed' && (
                <div className={`bg-surface-container p-4 rounded-xl border transition-colors ${executeState === 'completed' ? 'border-secondary-fixed/50 bg-secondary-fixed/5' : 'border-primary-container/20'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${executeState === 'completed' ? 'text-secondary-fixed' : 'text-primary-container'}`}>
                      {executeState === 'completed' ? 'Executed' : 'High Priority'}
                    </span>
                    <span className="text-[10px] text-slate-400">98% Match</span>
                  </div>
                  <p className="text-sm text-white font-medium mb-3">{prioritySuggestion}</p>
                  <div className="flex gap-2">
                    {executeState === 'idle' && (
                      <>
                        <button 
                          onClick={() => {
                            setExecuteState('executing');
                            setTimeout(() => setExecuteState('completed'), 2000);
                          }}
                          className="flex-1 py-2 bg-primary-container text-on-primary-container text-[10px] font-bold uppercase rounded-lg hover:bg-primary-container/90 transition-colors flex items-center justify-center gap-2"
                        >
                          <Send size={12} /> Execute
                        </button>
                        <button 
                          onClick={() => setExecuteState('dismissed')}
                          className="px-3 py-2 bg-surface-container-high text-slate-400 hover:text-white text-[10px] font-bold uppercase rounded-lg transition-colors"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                    {executeState === 'executing' && (
                      <button disabled className="flex-1 py-2 bg-primary-container/50 text-on-primary-container/50 text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                        <Loader2 size={12} className="animate-spin" /> Executing...
                      </button>
                    )}
                    {executeState === 'completed' && (
                      <button disabled className="flex-1 py-2 bg-secondary-fixed/20 text-secondary-fixed text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                        <CheckCircle2 size={12} /> Units Redeployed
                      </button>
                    )}
                  </div>
                </div>
              )}

              {rotationState !== 'dismissed' && (
                <div className={`bg-surface-container p-4 rounded-xl border transition-colors ${rotationState === 'completed' ? 'border-secondary-fixed/50 bg-secondary-fixed/5' : 'border-white/5'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${rotationState === 'completed' ? 'text-secondary-fixed' : 'text-slate-300'}`}>
                      {rotationState === 'completed' ? 'Scheduled' : 'Optimization'}
                    </span>
                    <span className="text-[10px] text-slate-400">85% Match</span>
                  </div>
                  <p className="text-sm text-slate-300 font-medium mb-3">{optimizationSuggestion}</p>
                  <div className="flex gap-2">
                    {rotationState === 'idle' && (
                      <>
                        <button 
                          onClick={() => {
                            setRotationState('scheduling');
                            setTimeout(() => setRotationState('completed'), 1500);
                          }}
                          className="flex-1 py-2 bg-surface-container-high text-white text-[10px] font-bold uppercase rounded-lg hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
                        >
                          Schedule Rotation
                        </button>
                        <button 
                          onClick={() => setRotationState('dismissed')}
                          className="px-3 py-2 bg-surface-container-high text-slate-400 hover:text-white text-[10px] font-bold uppercase rounded-lg transition-colors"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                    {rotationState === 'scheduling' && (
                      <button disabled className="flex-1 py-2 bg-surface-container-high/50 text-white/50 text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                        <Loader2 size={12} className="animate-spin" /> Scheduling...
                      </button>
                    )}
                    {rotationState === 'completed' && (
                      <button disabled className="flex-1 py-2 bg-secondary-fixed/20 text-secondary-fixed text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                        <CheckCircle2 size={12} /> Rotation Scheduled
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
});

export default Staffing;
