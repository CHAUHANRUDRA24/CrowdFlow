import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  HeartPulse,
  Shield,
  LogOut
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import AIAssistant from './components/AIAssistant';
import CommandCenter from './components/tabs/CommandCenter';
import Analytics from './components/tabs/Analytics';
import Staffing from './components/tabs/Staffing';
import Heatmaps from './components/tabs/Heatmaps';
import Emergency from './components/tabs/Emergency';
import Login from './components/Login';
import { Responder, TelemetryData } from './types';
import { auth } from './firebase';
import {
  onAuthStateChanged,
  signOut,
  User,
  getRedirectResult,
} from 'firebase/auth';
import { useTelemetry } from './hooks/useTelemetry';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });

    getRedirectResult(auth).catch((error) => {
      console.error("Redirect login error:", error);
    });

    return () => unsubscribe();
  }, []);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [bellShaking, setBellShaking] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const { telemetry, responders, triggerScenario, dispatchUnit } = useTelemetry();

  const broadcastMessage = useCallback((message: string) => {
    console.log("Broadcast message:", message);
    setBellShaking(true);
    setTimeout(() => setBellShaking(false), 5000);
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

  const handleOpenRoster = useCallback(() => {
    setShowRosterModal(true);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'Dashboard': 
        return <CommandCenter 
          responders={responders} 
          telemetry={telemetry} 
          onOpenRoster={handleOpenRoster}
          onDispatchUnit={dispatchUnit}
          onBroadcastMessage={broadcastMessage}
        />;
      case 'Analytics': return <Analytics telemetry={telemetry} />;
      case 'Staffing': 
        return <Staffing 
          responders={responders} 
          telemetry={telemetry} 
          onDispatchUnit={dispatchUnit}
          onBroadcastMessage={broadcastMessage}
        />;
      case 'Heatmaps': return <Heatmaps responders={responders} telemetry={telemetry} />;
      case 'Emergency': 
        return <Emergency 
          responders={responders} 
          telemetry={telemetry} 
          onDispatchUnit={dispatchUnit}
          onBroadcastMessage={broadcastMessage}
        />;
      default: 
        return <CommandCenter 
          responders={responders} 
          telemetry={telemetry} 
          onOpenRoster={handleOpenRoster}
          onDispatchUnit={dispatchUnit}
          onBroadcastMessage={broadcastMessage}
        />;
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-slate-200 relative">
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

        <div className="px-4 mt-auto mb-8 space-y-4">
          <button 
            onClick={() => signOut(auth)}
            className="w-full py-3 bg-surface-container-high text-slate-400 hover:text-white font-bold rounded-xl active:scale-95 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-white/5 hover:border-white/10"
          >
            <LogOut size={14} />
            Sign Out
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
            <div className="flex items-center gap-3 relative">
              <button 
                onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
                aria-label="Open AI Assistant"
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
                  aria-label="Notifications"
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
                <p className="text-xs font-bold font-headline text-white leading-none uppercase">
                  {user.displayName || 'COMMANDER.SYS'}
                </p>
                <p className="text-[10px] text-secondary-fixed uppercase tracking-widest mt-1">Authorized</p>
              </div>
              <div className="relative w-10 h-10 rounded-xl border-2 border-primary-container p-0.5">
                <img 
                  alt="User Profile" 
                  className="w-full h-full rounded-lg object-cover" 
                  src={user.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCmiy62EXePiaczdccCE3I-CVLNXCFqcpaFgrJkgmZQPvUtVBPT8asI05cUwrY1TdmlqLYfbaKy4nyF15fNgLHxGDtSJGIpOZ6VMv1zkCFN1WmFwLsUHngNVJ1ewTJcJk3vMCPxJ_-w78z9afM5to8kSacs5APP_vxaKXDUGtbVea2hAGBfFHYeFaeSjbAKCQsWTMC07mGvUCpFl_kCzwVcnn7edEWNZ9n-WvexJyDEoA4NckI_5KhfBfXNIFie1dCf78kv5RygSXDx"}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-secondary-fixed border-2 border-surface-container rounded-full"></div>
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

      {/* Roster Modal */}
      <AnimatePresence>
        {showRosterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-container-low border border-white/10 rounded-3xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="font-headline text-2xl font-bold text-white tracking-tight uppercase flex items-center gap-2">
                  <Users className="text-primary-container" size={24} />
                  Detailed Staff Roster
                </h2>
                <button 
                  onClick={() => setShowRosterModal(false)}
                  aria-label="Close roster modal"
                  className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-4">
                {[
                  { id: 'A-09', name: 'Unit Alpha-09', role: 'Crowd Control', sector: 'North Plaza', status: 'Active', hr: 84, fat: 12, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoLRNIKQYjla6LjjUeo76rOFQNKSDiKwhEzRMPpwUnf4_Ah65r7oTvQBr-wWN_jUbB1kTVOf_qduLXqABpyuBlKJAXa9AngylJu2KHjkhkPt8C0frhYr10mciYKKrMs2j7Oy2CDSYR7BQVOmh7QEYPDmUkY8-fLZna7D82_--2-VzZdLEKNpAo2GekXYwRAhjHS6QLI550jCVp8kr5dg-3mMUTtCPIMVHb6hlNqtOcwzAH9N4RDkXBfYb1u4VWjr-wj-k647wuxZRO' },
                  { id: 'G-14', name: 'Unit Gamma-14', role: 'Security', sector: 'Gate B Crowds', status: 'Responding', hr: 142, fat: 88, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5c9PRbIXmMJ5P8ETIk7OJnGRLo5MorVr39esSMloPHCDi2G6cRuLKIOzY_LV13ikc2ab24Dk9xIbpbzd5o_dFE1sRTdcheMoSR7wTntFcCV7032and1cRAyqL4zZxO836C4o4UmUWlgOaNxP42kRt6ZBYtVIULsB9qn8qMjJ-__h5TmIEu3ZfcVw8cuz3426jFIpRLIerLTRtTCahO9EdJsR-RqgSuczIN6QORL56EwW-QKv0NyngmCgsDR1qmY1c56jGYtxheFbF' },
                  { id: 'M-03', name: 'Medic-03', role: 'Medical', sector: 'Concourse 2', status: 'Active', hr: 62, fat: 45, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKkvH73dOz6MUCAHuKILiyDK9w-AjtY7NTIE_bNkq9ku-JLbnDPsehhXDeKSE_dj1C0Epaf3rQvCjJrRRgaoC9iCHwSsBuaB-fQDGAJA6lusmnyGN85X9A40UPmYMYDIXkOSCiRT45Ih5NZkZ4l3MKq4Qx0efyTuNDalQHuK2a65faiYTIZmeGqTgCyXzUwgUT4OYuEB5Vwqk4uQXSOratR0W_N6uvuYSi-XPSTrUE01oeB-L0gQa2X1P2LDByZxAgVuiTx7parhcF' },
                  { id: 'B-02', name: 'Unit Beta-02', role: 'Crowd Control', sector: 'South Plaza', status: 'Active', hr: 91, fat: 28, img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' },
                  { id: 'D-11', name: 'Unit Delta-11', role: 'Security', sector: 'Gate C', status: 'Active', hr: 78, fat: 15, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
                  { id: 'M-01', name: 'Medic-01', role: 'Medical', sector: 'Sector 102', status: 'Responding', hr: 115, fat: 60, img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200' },
                ].map((staff, i) => (
                  <div key={i} className="bg-surface-container rounded-2xl p-4 border border-white/5 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img src={staff.img} alt={staff.name} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <p className="text-sm font-bold text-white">{staff.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{staff.role}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                        staff.status === 'Active' ? 'bg-secondary-fixed/10 text-secondary-fixed' : 'bg-tertiary-fixed-dim/10 text-tertiary-fixed-dim'
                      }`}>
                        {staff.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Sector</p>
                        <p className="text-xs font-semibold text-white">{staff.sector}</p>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">ID</p>
                        <p className="text-xs font-mono text-slate-300">{staff.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Heart Rate</p>
                          <p className={`text-xs font-bold ${staff.hr > 120 ? 'text-error animate-pulse' : 'text-secondary-fixed'}`}>{staff.hr} bpm</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Fatigue</p>
                          <p className={`text-xs font-bold ${staff.fat > 70 ? 'text-error' : 'text-slate-300'}`}>{staff.fat}%</p>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 bg-primary-container/10 text-primary-container hover:bg-primary-container/20 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors">
                        Comms
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
