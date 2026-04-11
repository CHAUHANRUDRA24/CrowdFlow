import React, { useState, useEffect } from 'react';
import { Activity, Users, ThermometerSun, Shield, HeartPulse, Flame } from 'lucide-react';
import { Responder, TelemetryData } from '../../App';

interface HeatmapsProps {
  responders?: Responder[];
  telemetry: TelemetryData;
}

export default function Heatmaps({ responders = [], telemetry }: HeatmapsProps) {
  const [activeLayer, setActiveLayer] = useState('Density');
  const [blobs, setBlobs] = useState([
    { top: 25, left: 33, size: 64, color: 'bg-error/40' },
    { top: 50, left: 75, size: 96, color: 'bg-error/20' },
    { top: 75, left: 50, size: 72, color: 'bg-secondary-fixed/20' },
    { top: 33, left: 66, size: 48, color: 'bg-tertiary-fixed-dim/30' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlobs(prev => prev.map(blob => ({
        ...blob,
        size: Math.max(30, blob.size + Math.floor(Math.random() * 10 - 5)),
        top: Math.min(90, Math.max(10, blob.top + Math.floor(Math.random() * 4 - 2))),
        left: Math.min(90, Math.max(10, blob.left + Math.floor(Math.random() * 4 - 2))),
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="space-y-6 h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex gap-4">
        {[
          { name: 'Density', icon: Users },
          { name: 'Flow Velocity', icon: Activity },
          { name: 'Dwell Time', icon: ThermometerSun },
        ].map((layer, i) => (
          <button 
            key={i} 
            onClick={() => setActiveLayer(layer.name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${
              activeLayer === layer.name ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-slate-400 hover:text-white'
            }`}
          >
            <layer.icon size={16} />
            {layer.name}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-surface-container-low rounded-3xl overflow-hidden relative border border-outline-variant/10">
        <div className="absolute inset-0 z-0">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC96nJKRjm7NQQDo4IE0Kv9eIyzQWfbnV1lqq1252jBJdJS8JZF9P9QZpvxYSli-av1TeVcgmtFJ5riTTv_sbtZ5oZd3Mr_uXx8InWm_IDgh8STRNT28mEpxNm9p3Twk-gjrT11TjP0UGSMTMEg4iHW7ugNio2_zLd-azVUpgXXc1CUgza0nLOe9p1ZFCovdrWENe6C7n1l65U4acZY5lyPzz3QC_PfOh3YM10L9jLMXzpHlCg_qgHb4VLkrzPO3UG3OcciUBjdwqkr"
            alt="Stadium Blueprint"
            className="w-full h-full object-cover opacity-40 grayscale mix-blend-screen"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-80"></div>
        
        {/* Heatmap Blobs */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="relative w-full h-full">
            {blobs.map((blob, i) => {
              let colorClass = blob.color;
              if (activeLayer === 'Flow Velocity') {
                colorClass = ['bg-primary/40', 'bg-primary-container/30', 'bg-secondary/20', 'bg-primary/20'][i];
              } else if (activeLayer === 'Dwell Time') {
                colorClass = ['bg-tertiary-fixed-dim/40', 'bg-error/30', 'bg-tertiary-fixed/20', 'bg-error/20'][i];
              }
              return (
                <div 
                  key={i}
                  className={`absolute ${colorClass} blur-[60px] rounded-full transition-all duration-3000 ease-in-out ${i === 0 ? 'animate-pulse' : ''}`}
                  style={{
                    top: `${blob.top}%`,
                    left: `${blob.left}%`,
                    width: `${blob.size}px`,
                    height: `${blob.size}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                ></div>
              );
            })}

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
                  className="absolute flex flex-col items-center pointer-events-auto z-30 transition-all duration-1000 ease-linear"
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
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-8 left-8 z-20 glass-panel p-6 rounded-2xl border border-white/10 max-w-sm">
          <h4 className="font-bold text-white mb-2">
            {activeLayer === 'Density' && 'High Density Alert'}
            {activeLayer === 'Flow Velocity' && 'Flow Velocity Alert'}
            {activeLayer === 'Dwell Time' && 'Dwell Time Alert'}
          </h4>
          <p className="text-sm text-slate-300 mb-4">
            {activeLayer === 'Density' && `Sector 4 (North Plaza) is currently at ${telemetry.crowdDensity}% capacity. Flow velocity has decreased to ${telemetry.velocity}m/s.`}
            {activeLayer === 'Flow Velocity' && `Sector 4 (North Plaza) flow velocity has decreased to ${telemetry.velocity}m/s, causing bottlenecks.`}
            {activeLayer === 'Dwell Time' && `Sector 4 (North Plaza) average dwell time is exceeding ${telemetry.dwellTime} minutes.`}
          </p>
          <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors">
            Analyze Sector
          </button>
        </div>
      </div>
    </div>
  );
}
