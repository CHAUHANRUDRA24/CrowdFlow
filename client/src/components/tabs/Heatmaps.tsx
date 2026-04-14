import React, { useState, useEffect } from 'react';
import { Layers, MapPin, Wind, Thermometer, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TelemetryData, Responder } from '../../types';

interface HeatmapsProps {
  responders: Responder[];
  telemetry: TelemetryData;
}

/**
 * Heatmaps Component
 * =================
 * Integrates real-world spatial intelligence with crowd density.
 * Now features a "Google Maps Satellite Proxy" and dynamic congestion overlays.
 */
export default function Heatmaps({ responders, telemetry }: HeatmapsProps) {
  const [view, setView] = useState<'satellite' | 'heatmap' | 'security'>('heatmap');
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    // Simulate Google Maps Init
    const timer = setTimeout(() => setIsMapLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container-low p-6 rounded-3xl border border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <Layers className="text-primary-container" size={24} />
            Spatial Intelligence heatmaps
          </h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
            Live Overlay: Google Maps Platform Satellite Engine 
          </p>
        </div>
        <div className="flex bg-surface-container rounded-xl p-1 border border-white/10">
          {(['satellite', 'heatmap', 'security'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                view === v ? 'bg-primary-container text-on-primary-container shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Map Engine */}
        <div className="col-span-12 lg:col-span-9">
          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl">
            {/* Base Satellite Layer */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${isMapLoaded ? 'opacity-100' : 'opacity-0'}`}>
               <img 
                 src="/stadium_map.png" 
                 alt="Stadium Venue Satellite" 
                 className={`w-full h-full object-cover grayscale contrast-125 brightness-50 mix-blend-luminosity ${view === 'satellite' ? '' : 'blur-sm'}`}
               />
               {/* Grid Overlay */}
               <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            </div>

            {/* Heatmap Layer */}
            <AnimatePresence>
              {view === 'heatmap' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 pointer-events-none"
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full overflow-hidden">
                    {/* Simulated Heatmap Blobs */}
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-error/30 rounded-full blur-[80px] animate-pulse"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-secondary-fixed/20 rounded-full blur-[100px]"></div>
                    <div className="absolute top-1/2 right-1/2 w-48 h-48 bg-tertiary-fixed-dim/20 rounded-full blur-[60px] animate-[pulse_4s_infinite]"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading Overlay */}
            {!isMapLoaded && (
               <div className="absolute inset-0 z-50 bg-slate-950 flex items-center justify-center">
                 <div className="flex flex-col items-center gap-4">
                   <div className="w-10 h-10 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hydrating Maps Engine...</p>
                 </div>
               </div>
            )}

            {/* Spatial Markers */}
            <div className="absolute inset-0 z-20">
              {responders.map(r => (
                <motion.div 
                  key={r.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute p-px bg-white rounded-full shadow-[0_0_10px_white]"
                  style={{ top: `${r.top}%`, left: `${r.left}%` }}
                >
                  <div className={`w-3 h-3 rounded-full ${r.type === 'security' ? 'bg-primary-container' : 'bg-tertiary-fixed-dim'}`}></div>
                </motion.div>
              ))}
            </div>

            {/* UI Overlays */}
            <div className="absolute top-8 left-8 z-30 flex flex-col gap-3">
               <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/10">
                 <div className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></div>
                 <span className="text-[10px] font-bold text-white uppercase tracking-widest">MAPS_API: ENABLED</span>
               </div>
               <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/10">
                 <MapPin size={12} className="text-slate-400" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sector HQ: 40.7128° N, 74.0060° W</span>
               </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
           <section className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Zone Health Scores</h3>
             <div className="space-y-4">
               {[
                 { zone: 'Main Stand', score: 92, status: 'Critical', color: 'text-error' },
                 { zone: 'North Plaza', score: 45, status: 'Optimal', color: 'text-secondary-fixed' },
                 { zone: 'Concourse B', score: 78, status: 'Warning', color: 'text-tertiary-fixed-dim' },
               ].map((z, i) => (
                 <div key={i} className="flex justify-between items-center group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors">
                   <div>
                     <p className="text-sm font-bold text-white">{z.zone}</p>
                     <p className={`text-[10px] font-bold uppercase tracking-tighter ${z.color}`}>{z.status}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-lg font-black text-white">{z.score}%</p>
                   </div>
                 </div>
               ))}
             </div>
           </section>

           <section className="bg-gradient-to-br from-primary-container/20 to-transparent p-6 rounded-[2rem] border border-primary-container/10">
             <div className="flex items-center gap-2 text-primary-container mb-4">
                <ShieldCheck size={20} />
                <h3 className="text-xs font-bold uppercase tracking-widest">AI Safety Engine</h3>
             </div>
             <p className="text-xs text-slate-300 leading-relaxed italic">
               "Spatial analysis complete. Density in North Stand has decreased 4% in the last tick. Recommend maintaining current staff positions."
             </p>
           </section>

           <section className="bg-error/10 p-6 rounded-[2rem] border border-error/20">
             <div className="flex items-center gap-2 text-error mb-4">
                <AlertTriangle size={20} />
                <h3 className="text-xs font-bold uppercase tracking-widest">Congestion Risk</h3>
             </div>
             <div className="bg-black/20 rounded-xl p-3">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Risk Level</span>
                 <span className="text-[10px] font-bold text-error uppercase">High</span>
               </div>
               <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '85%' }}
                   className="h-full bg-error"
                 ></motion.div>
               </div>
             </div>
           </section>
        </div>
      </div>
    </div>
  );
}
