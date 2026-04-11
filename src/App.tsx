import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  BarChart2,
  Users,
  Layers,
  AlertTriangle,
  Send,
  HelpCircle,
  History,
  Cloud,
  Bell,
  Settings,
  TrendingUp,
  TrendingDown,
  UserX,
  Unlock,
  Megaphone,
  Bot,
  X,
  HeartPulse
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import AIAssistant from './components/AIAssistant';
import CommandCenter from './components/tabs/CommandCenter';
import Analytics from './components/tabs/Analytics';
import Staffing from './components/tabs/Staffing';
import Heatmaps from './components/tabs/Heatmaps';
import Emergency from './components/tabs/Emergency';

export interface Responder {
  id: string;
  name: string;
  type: string;
  top: number;
  left: number;
  status: string;
  eta: string;
}

export interface TelemetryData {
  weather: { temp: number; wind: number; precip: number; condition: string };
  attendance: number;
  gateThroughput: number;
  avgWaitTime: number;
  waits: { ca: number; cb: number; rn: number; rs: number };
  activeFlow: number;
  fireTemp: number;
  crowdDensity: number;
  patientHeartRate: number;
  units: Record<string, { hr: number; fat: number }>;
  peakCapacity: number;
  dwellTime: number;
  growth: number;
  gateFlows: { gate: string; flow: number; color: string }[];
  flowData: { value: number }[];
  sectorDist: number;
  latency: number;
  onlineFeeds: number;
  activeComms: number;
  activeIncidents: number;
  criticalAlerts: number;
  unitsDeployed: number;
  velocity: number;
  activeAlerts: { id: string; title: string; description: string; time: string; severity: 'critical' | 'warning' | 'info' }[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [globalAlert, setGlobalAlert] = useState<{title: string, message: string} | null>(null);
  const [bellShaking, setBellShaking] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [activeScenario, setActiveScenario] = useState<'none' | 'evacuation'>('none');
  const activeScenarioRef = useRef<'none' | 'evacuation'>('none');

  const triggerScenario = (scenario: 'none' | 'evacuation') => {
    if (activeScenario === scenario) {
      setActiveScenario('none');
      activeScenarioRef.current = 'none';
      setGlobalAlert(null);
      return;
    }
    setActiveScenario(scenario);
    activeScenarioRef.current = scenario;
    if (scenario === 'evacuation') {
      setGlobalAlert({
        title: "MANDATORY EVACUATION",
        message: "Severe weather protocol initiated. All gates set to egress. Directing crowds to nearest exits."
      });
      setBellShaking(true);
      setTimeout(() => setBellShaking(false), 5000);
    }
  };

  const dispatchUnit = (unitId: string, location: string) => {
    setResponders(prev => prev.map(unit => {
      if (unit.id === unitId) {
        return { ...unit, status: 'En Route', eta: '2m 00s' }; // Simplified dispatch
      }
      return unit;
    }));
  };

  const broadcastMessage = (message: string) => {
    setGlobalAlert({
      title: "AI BROADCAST",
      message: message
    });
    setBellShaking(true);
    setTimeout(() => setBellShaking(false), 5000);
  };

  const [responders, setResponders] = useState<Responder[]>([
    { id: 'u-7', name: 'Unit 7', type: 'security', top: 40, left: 35, status: 'En Route', eta: '1m 30s' },
    { id: 'u-9', name: 'Unit 9', type: 'security', top: 45, left: 30, status: 'Patrol', eta: '' },
    { id: 'u-12', name: 'Unit 12', type: 'security', top: 20, left: 60, status: 'Stationary', eta: '' },
    { id: 'emt-4', name: 'EMT Unit 4', type: 'medical', top: 60, left: 50, status: 'On Scene', eta: '' },
    { id: 'fire-alpha', name: 'Fire Team Alpha', type: 'fire', top: 35, left: 60, status: 'En Route', eta: '45s' },
  ]);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    weather: { temp: 22.4, wind: 14.2, precip: 65, condition: 'Light Rain' },
    attendance: 42892,
    gateThroughput: 840,
    avgWaitTime: 4.2,
    waits: { ca: 18, cb: 8, rn: 2, rs: 12 },
    activeFlow: 94,
    fireTemp: 450,
    crowdDensity: 92,
    patientHeartRate: 115,
    units: {
      'u-7': { hr: 85, fat: 88 },
      'u-9': { hr: 72, fat: 45 },
      'u-12': { hr: 68, fat: 20 },
      'emt-4': { hr: 110, fat: 60 },
      'fire-alpha': { hr: 135, fat: 75 }
    },
    peakCapacity: 94,
    dwellTime: 3.2,
    growth: 12,
    gateFlows: [
      { gate: 'Gate A (North)', flow: 85, color: 'bg-primary-container' },
      { gate: 'Gate B (East)', flow: 95, color: 'bg-error' },
      { gate: 'Gate C (South)', flow: 45, color: 'bg-secondary-fixed' },
      { gate: 'Gate D (West)', flow: 60, color: 'bg-tertiary-fixed-dim' },
    ],
    flowData: [
      { value: 30 }, { value: 45 }, { value: 25 }, { value: 80 }, { value: 50 }, { value: 35 },
    ],
    sectorDist: 75,
    latency: 12,
    onlineFeeds: 142,
    activeComms: 8,
    activeIncidents: 3,
    criticalAlerts: 1,
    unitsDeployed: 42,
    velocity: 0.5,
    activeAlerts: [
      { id: 'a1', title: 'Overcrowding Event', description: 'Gate C capacity exceeded by 24%.', time: '02:45m Ago', severity: 'critical' },
      { id: 'a2', title: 'Medical Emergency', description: 'Sector 102 - Row J. Fainting reported.', time: '08:12m Ago', severity: 'warning' }
    ]
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Update responders
      setResponders(prev => prev.map(unit => {
        let moveTop = 0;
        let moveLeft = 0;
        let newStatus = unit.status;
        
        if (unit.status === 'En Route') {
           let targetTop = unit.top;
           let targetLeft = unit.left;
           if (unit.id === 'u-7') { targetTop = 33.33; targetLeft = 25; }
           else if (unit.id === 'fire-alpha') { targetTop = 20; targetLeft = 70; }
           else if (unit.id === 'u-9') { targetTop = 33.33; targetLeft = 25; }
           
           const distTop = targetTop - unit.top;
           const distLeft = targetLeft - unit.left;
           const distance = Math.sqrt(distTop*distTop + distLeft*distLeft);
           
           if (distance < 2) {
             newStatus = 'On Scene';
             unit.eta = '';
           } else {
             moveTop = (distTop / distance) * 1.5;
             moveLeft = (distLeft / distance) * 1.5;
           }
        } else if (unit.status === 'Patrol') {
           moveTop = (Math.random() - 0.5) * 2;
           moveLeft = (Math.random() - 0.5) * 2;
        } else {
           moveTop = (Math.random() - 0.5) * 0.2;
           moveLeft = (Math.random() - 0.5) * 0.2;
        }
        
        return {
          ...unit,
          status: newStatus,
          top: Math.max(10, Math.min(90, unit.top + moveTop)),
          left: Math.max(10, Math.min(90, unit.left + moveLeft)),
        };
      }));

      // Update telemetry
      setTelemetry(prev => {
        const precipSpike = Math.random() > 0.9 ? Math.random() * 30 : 0;
        const windSpike = Math.random() > 0.9 ? Math.random() * 15 : 0;
        const newPrecip = Math.min(100, Math.max(0, prev.weather.precip + Math.floor(Math.random() * 5 - 2) + precipSpike));
        const newWind = Number((Math.max(0, prev.weather.wind + (Math.random() * 2 - 1) + windSpike)).toFixed(1));
        
        const nextUnits = { ...prev.units };
        Object.keys(nextUnits).forEach(key => {
          nextUnits[key] = {
            hr: Math.max(60, Math.min(160, nextUnits[key].hr + Math.floor(Math.random() * 7 - 3))),
            fat: Math.min(100, Math.max(0, nextUnits[key].fat + (Math.random() * 0.5 - 0.1)))
          };
        });

        return {
          ...prev,
          weather: {
            temp: activeScenarioRef.current === 'evacuation' ? Number((prev.weather.temp - 0.5).toFixed(1)) : Number((prev.weather.temp + (Math.random() * 0.4 - 0.2)).toFixed(1)),
            wind: activeScenarioRef.current === 'evacuation' ? Math.min(80, prev.weather.wind + 5) : newWind,
            precip: activeScenarioRef.current === 'evacuation' ? Math.min(100, prev.weather.precip + 10) : newPrecip,
            condition: activeScenarioRef.current === 'evacuation' ? 'Severe Storm' : (newPrecip > 80 ? 'Heavy Rain' : newPrecip > 40 ? 'Light Rain' : newPrecip > 15 ? 'Cloudy' : 'Clear')
          },
          attendance: activeScenarioRef.current === 'evacuation' ? Math.max(0, prev.attendance - Math.floor(Math.random() * 500 + 200)) : prev.attendance + Math.floor(Math.random() * 5),
          gateThroughput: activeScenarioRef.current === 'evacuation' ? Math.min(1200, prev.gateThroughput + Math.floor(Math.random() * 100 + 50)) : Math.floor(prev.gateThroughput + (Math.random() * 40 - 20)),
          avgWaitTime: Number((prev.avgWaitTime + (Math.random() * 0.4 - 0.2)).toFixed(1)),
          waits: {
            ca: Math.max(0, prev.waits.ca + Math.floor(Math.random() * 3 - 1)),
            cb: Math.max(0, prev.waits.cb + Math.floor(Math.random() * 3 - 1)),
            rn: Math.max(0, prev.waits.rn + Math.floor(Math.random() * 3 - 1)),
            rs: Math.max(0, prev.waits.rs + Math.floor(Math.random() * 3 - 1)),
          },
          activeFlow: Math.min(100, Math.max(0, prev.activeFlow + Math.floor(Math.random() * 3 - 1))),
          fireTemp: Math.max(20, prev.fireTemp + Math.floor(Math.random() * 20 - 10)),
          crowdDensity: activeScenarioRef.current === 'evacuation' ? Math.min(100, prev.crowdDensity + Math.floor(Math.random() * 5)) : Math.min(100, Math.max(0, prev.crowdDensity + Math.floor(Math.random() * 5 - 2))),
          patientHeartRate: Math.max(40, Math.min(180, prev.patientHeartRate + Math.floor(Math.random() * 10 - 5))),
          units: nextUnits,
          peakCapacity: Math.min(100, Math.max(80, prev.peakCapacity + Math.floor(Math.random() * 3 - 1))),
          dwellTime: Number((prev.dwellTime + (Math.random() * 0.2 - 0.1)).toFixed(1)),
          growth: Math.max(0, prev.growth + Math.floor(Math.random() * 3 - 1)),
          gateFlows: prev.gateFlows.map(gate => ({
            ...gate,
            flow: activeScenarioRef.current === 'evacuation' ? Math.min(100, gate.flow + Math.floor(Math.random() * 15 + 5)) : Math.min(100, Math.max(20, gate.flow + Math.floor(Math.random() * 5 - 2))),
            color: activeScenarioRef.current === 'evacuation' ? 'bg-error' : (gate.flow > 80 ? 'bg-error' : gate.flow > 50 ? 'bg-secondary-fixed' : 'bg-primary-container')
          })),
          flowData: [...prev.flowData.slice(1), { value: activeScenarioRef.current === 'evacuation' ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 60) + 20 }],
          sectorDist: activeScenarioRef.current === 'evacuation' ? Math.max(0, prev.sectorDist - 2) : Math.min(100, Math.max(0, prev.sectorDist + Math.floor(Math.random() * 3 - 1))),
          latency: activeScenarioRef.current === 'evacuation' ? Math.min(150, prev.latency + Math.floor(Math.random() * 10)) : Math.max(8, prev.latency + Math.floor(Math.random() * 9 - 4)),
          onlineFeeds: Math.min(150, Math.max(135, prev.onlineFeeds + Math.floor(Math.random() * 3 - 1))),
          activeComms: activeScenarioRef.current === 'evacuation' ? Math.min(25, prev.activeComms + 2) : Math.max(5, prev.activeComms + Math.floor(Math.random() * 3 - 1)),
          activeIncidents: activeScenarioRef.current === 'evacuation' ? Math.min(15, prev.activeIncidents + (Math.random() > 0.7 ? 1 : 0)) : (Math.random() > 0.8 ? Math.max(1, prev.activeIncidents + (Math.random() > 0.5 ? 1 : -1)) : prev.activeIncidents),
          criticalAlerts: activeScenarioRef.current === 'evacuation' ? Math.min(5, prev.criticalAlerts + (Math.random() > 0.8 ? 1 : 0)) : (Math.random() > 0.9 ? Math.max(0, prev.criticalAlerts + (Math.random() > 0.5 ? 1 : -1)) : prev.criticalAlerts),
          unitsDeployed: activeScenarioRef.current === 'evacuation' ? Math.min(60, prev.unitsDeployed + 1) : (Math.random() > 0.7 ? Math.max(30, prev.unitsDeployed + (Math.random() > 0.5 ? 1 : -1)) : prev.unitsDeployed),
          velocity: Number((Math.max(0.1, prev.velocity + (activeScenarioRef.current === 'evacuation' ? 0.1 : (Math.random() * 0.2 - 0.1)))).toFixed(2)),
          activeAlerts: activeScenarioRef.current === 'evacuation' ? [
            { id: 'e1', title: 'MANDATORY EVACUATION', description: 'Severe weather protocol initiated. All gates set to egress.', time: 'Just Now', severity: 'critical' },
            { id: 'e2', title: 'Gate C Overcrowd', description: 'Mass exodus causing bottleneck.', time: '1m Ago', severity: 'critical' },
            ...prev.activeAlerts.slice(0, 2)
          ] : prev.activeAlerts
        };
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Simulate an incoming alert after 3 seconds for demonstration
    const timer = setTimeout(() => {
      setGlobalAlert({
        title: "CRITICAL ALERT",
        message: "Unauthorized access detected in Sector 7. Security dispatched."
      });
      setBellShaking(true);
      
      // Stop shaking after 5 seconds
      setTimeout(() => setBellShaking(false), 5000);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'Dashboard': return <CommandCenter responders={responders} telemetry={telemetry} />;
      case 'Analytics': return <Analytics telemetry={telemetry} />;
      case 'Staffing': return <Staffing responders={responders} telemetry={telemetry} />;
      case 'Heatmaps': return <Heatmaps responders={responders} telemetry={telemetry} />;
      case 'Emergency': return <Emergency responders={responders} telemetry={telemetry} />;
      default: return <CommandCenter responders={responders} telemetry={telemetry} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-slate-200 relative">
      {/* Global Toast Notification */}
      <AnimatePresence>
        {globalAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="absolute top-6 right-6 z-[100] w-96 bg-surface-container-highest border-l-4 border-error rounded-xl shadow-[0_10px_40px_rgba(239,68,68,0.2)] overflow-hidden"
          >
            <div className="p-4 flex items-start gap-3">
              <div className="bg-error/20 p-2 rounded-lg text-error mt-1">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-error font-bold text-sm uppercase tracking-wider">{globalAlert.title}</h4>
                  <button 
                    onClick={() => setGlobalAlert(null)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-slate-300 text-sm mt-1 leading-relaxed">{globalAlert.message}</p>
                <div className="mt-3 flex gap-2">
                  <button 
                    onClick={() => {
                      setActiveTab('Emergency');
                      setGlobalAlert(null);
                    }}
                    className="px-3 py-1.5 bg-error/20 text-error text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-error/30 transition-colors"
                  >
                    View Incident
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-surface-container-low flex flex-col py-8 z-50 border-r border-outline-variant/20">
        <div className="px-6 mb-10">
          <h1 className="font-headline font-black text-primary-container text-2xl tracking-tighter">
            CrowdFlow AI
          </h1>
          <p className="text-xs font-medium tracking-wider uppercase text-slate-400 mt-1">Command Center</p>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          {[
            { name: 'Dashboard', icon: LayoutDashboard },
            { name: 'Analytics', icon: BarChart2 },
            { name: 'Staffing', icon: Users },
            { name: 'Heatmaps', icon: Layers },
            { name: 'Emergency', icon: AlertTriangle },
          ].map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`group w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-bold rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-container/20 to-transparent text-primary-container border border-primary-container/20 shadow-[inset_4px_0_0_0_rgba(0,240,255,1)]'
                    : 'text-slate-500 hover:bg-surface-container-high hover:text-slate-200 border border-transparent'
                }`}
              >
                <item.icon 
                  size={18} 
                  className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : 'group-hover:scale-110'}`} 
                />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-4 mt-auto mb-8">
          <button className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-bold rounded-xl active:scale-95 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <AlertTriangle size={16} className="fill-current" />
            Active Alerts
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth p-8 bg-surface relative">
        <header className="flex justify-between items-start mb-8">
          <div>
            <h2 className="font-headline text-4xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500 drop-shadow-sm">
              {activeTab === 'Dashboard' ? 'Venue Command Center' : activeTab}
            </h2>
            <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-secondary-fixed shadow-[0_0_8px_#79ff5b] animate-pulse"></span>
              Live Telemetry: Active Operation - Night Session
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-outline-variant/20 pr-6">
              <button
                onClick={() => triggerScenario('evacuation')}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 ${
                  activeScenario === 'evacuation'
                    ? 'bg-error text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                    : 'bg-surface-container-high text-slate-300 hover:bg-surface-container-highest border border-error/30 hover:border-error/60'
                }`}
              >
                <AlertTriangle size={14} />
                {activeScenario === 'evacuation' ? 'End Evac Drill' : 'Run Evac Drill'}
              </button>
            </div>
            <div className="flex items-center gap-3 relative">
              <button 
                onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isAIPanelOpen 
                    ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(0,240,255,0.4)]' 
                    : 'bg-surface-container-high text-slate-400 hover:text-white hover:bg-surface-container-highest'
                }`}
              >
                <Bot size={20} />
              </button>
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isNotificationsOpen
                      ? 'bg-surface-container-highest text-white'
                      : 'bg-surface-container-high text-slate-400 hover:text-white hover:bg-surface-container-highest'
                  } ${bellShaking ? 'animate-[wiggle_0.3s_ease-in-out_infinite]' : ''}`}
                >
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-highest/50">
                        <h3 className="font-bold text-sm text-white uppercase tracking-wider">Alerts</h3>
                        <span className="px-2 py-0.5 bg-error/20 text-error rounded text-[10px] font-bold">2 New</span>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <div 
                          className="p-4 border-b border-outline-variant/10 hover:bg-white/5 cursor-pointer transition-colors relative"
                          onClick={() => {
                            setActiveTab('Emergency');
                            setIsNotificationsOpen(false);
                          }}
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-error font-bold text-xs uppercase tracking-tight flex items-center gap-1">
                              <AlertTriangle size={12} /> Overcrowding
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">Just now</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-1">Gate C Entrance</h4>
                          <p className="text-xs text-slate-400 line-clamp-2">Capacity exceeded by 24%. Crowd pressure increasing at turnstiles.</p>
                        </div>
                        <div 
                          className="p-4 border-b border-outline-variant/10 hover:bg-white/5 cursor-pointer transition-colors relative"
                          onClick={() => {
                            setActiveTab('Emergency');
                            setIsNotificationsOpen(false);
                          }}
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary-fixed-dim"></div>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-tertiary-fixed-dim font-bold text-xs uppercase tracking-tight flex items-center gap-1">
                              <HeartPulse size={12} /> Medical
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">8m ago</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-1">Sector 102 - Row J</h4>
                          <p className="text-xs text-slate-400 line-clamp-2">Reports of fainting/heat stroke. EMT Unit 04 dispatched.</p>
                        </div>
                      </div>
                      <div className="p-3 bg-surface-container-highest/30 text-center border-t border-outline-variant/20">
                        <button 
                          onClick={() => {
                            setActiveTab('Emergency');
                            setIsNotificationsOpen(false);
                          }}
                          className="text-xs font-bold text-primary-container hover:text-primary transition-colors uppercase tracking-widest"
                        >
                          View All Incidents
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="h-8 w-px bg-outline-variant/30 hidden sm:block"></div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold font-headline text-white leading-none">COMMANDER.SYS</p>
                <p className="text-[10px] text-secondary-fixed uppercase tracking-widest mt-1">Authorized</p>
              </div>
              <div className="w-10 h-10 rounded-xl border-2 border-primary-container p-0.5">
                <img 
                  alt="User Profile" 
                  className="w-full h-full rounded-lg object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmiy62EXePiaczdccCE3I-CVLNXCFqcpaFgrJkgmZQPvUtVBPT8asI05cUwrY1TdmlqLYfbaKy4nyF15fNgLHxGDtSJGIpOZ6VMv1zkCFN1WmFwLsUHngNVJ1ewTJcJk3vMCPxJ_-w78z9afM5to8kSacs5APP_vxaKXDUGtbVea2hAGBfFHYeFaeSjbAKCQsWTMC07mGvUCpFl_kCzwVcnn7edEWNZ9n-WvexJyDEoA4NckI_5KhfBfXNIFie1dCf78kv5RygSXDx"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <AIAssistant 
        isOpen={isAIPanelOpen} 
        onClose={() => setIsAIPanelOpen(false)} 
        telemetry={telemetry} 
        onTriggerEvacDrill={() => triggerScenario('evacuation')}
        onEndEvacDrill={() => triggerScenario('none')}
        onBroadcastMessage={broadcastMessage}
        onDispatchUnit={dispatchUnit}
      />
    </div>
  );
}
