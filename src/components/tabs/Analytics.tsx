import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Clock, Activity } from 'lucide-react';

import { TelemetryData } from '../../types';

interface AnalyticsProps {
  telemetry: TelemetryData;
}

const Analytics = React.memo(function Analytics({ telemetry }: AnalyticsProps) {
  const [attendanceData, setAttendanceData] = useState([
    { time: '18:00', count: 12000 },
    { time: '18:30', count: 25000 },
    { time: '19:00', count: 38000 },
    { time: '19:30', count: 41000 },
    { time: '20:00', count: 42892 },
    { time: '20:30', count: 42950 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAttendanceData(prev => {
        const lastTime = prev[prev.length - 1].time;
        const [hours, minutes] = lastTime.split(':').map(Number);
        let newMinutes = minutes + 30;
        let newHours = hours;
        if (newMinutes >= 60) {
          newMinutes = 0;
          newHours += 1;
        }
        const newTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
        const newCount = telemetry.attendance;
        
        return [...prev.slice(1), { time: newTime, count: newCount }];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [telemetry.attendance]);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Peak Capacity', value: `${telemetry.peakCapacity}%`, icon: Users, color: 'text-primary-container' },
          { label: 'Avg Dwell Time', value: `${telemetry.dwellTime} hrs`, icon: Clock, color: 'text-secondary-fixed' },
          { label: 'Flow Rate', value: `${telemetry.gateThroughput}/min`, icon: Activity, color: 'text-tertiary-fixed-dim' },
          { label: 'Growth', value: `+${telemetry.growth}%`, icon: TrendingUp, color: 'text-primary-container' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-container rounded-2xl p-5 border border-white/5">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{stat.label}</p>
              <stat.icon size={16} className={stat.color} />
            </div>
            <h4 className="font-headline text-3xl font-bold text-white">{stat.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container rounded-3xl p-6 border border-white/5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Attendance Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="time" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1d24', borderColor: '#ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#00f0ff' }}
                />
                <Area type="monotone" dataKey="count" stroke="#00f0ff" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-surface-container rounded-3xl p-6 border border-white/5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Gate Flow Distribution</h3>
          <div className="space-y-4">
            {telemetry.gateFlows.map((gate, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-300">{gate.gate}</span>
                  <span className="text-slate-400">{gate.flow}% Capacity</span>
                </div>
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className={`h-full ${gate.color} rounded-full transition-all duration-1000`} style={{ width: `${gate.flow}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default Analytics;
