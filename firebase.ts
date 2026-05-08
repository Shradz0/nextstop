import React, { useState, useEffect } from 'react';
import { auth, signIn, logout } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { TripPlanner } from './components/TripPlanner';
import { ItineraryView } from './components/ItineraryView';
import { InteractiveMap } from './components/InteractiveMap';
import { TripPlan } from './lib/gemini';
import { Compass, Sparkles, Map as MapIcon, Calendar, User as UserIcon, Settings, Info, Activity, Globe, Menu, X, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTrip, setActiveTrip] = useState<TripPlan | null>(null);
  const [view, setView] = useState<'plan' | 'list'>('plan');
  const [signingIn, setSigningIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      }, (error) => {
        console.warn("Location access denied", error);
      });
    }
    
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setSigningIn(false);
    });
  }, []);

  const handleSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await signIn();
    } catch (err) {
      console.error("Login failed", err);
    } finally {
      setSigningIn(false);
    }
  };

  const handleBack = () => {
    if (activeTrip) {
      setActiveTrip(null);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f8fafc] relative">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-50">
        <div className="flex items-center gap-2 lg:gap-4">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 lg:hidden text-slate-500 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          {activeTrip && (
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 mr-4"
              title="Return to Planning"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Back to Planner</span>
            </button>
          )}

          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <h1 className="text-base lg:text-lg font-bold tracking-tight text-slate-800 flex items-center gap-1">
            Next<span className="text-blue-600 font-black italic">Stop</span>
          </h1>
          <div className="hidden sm:block h-4 w-[1px] bg-slate-200 mx-2"></div>
          {activeTrip ? (
            <span className="hidden sm:flex text-xs lg:text-sm font-medium text-slate-700 items-center gap-2 truncate max-w-[200px] lg:max-w-none">
              <Globe className="w-4 h-4" />
              {activeTrip.destination}
            </span>
          ) : (
            <span className="hidden sm:block text-xs lg:text-sm font-medium text-slate-600">Next-Gen Travel Engine</span>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex gap-2 items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Intelligent Syncing</span>
          </div>
          
          <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold">{user.displayName}</p>
                  <button onClick={logout} className="text-[10px] text-slate-600 hover:text-red-600 transition-colors uppercase tracking-widest font-black">Sign Out</button>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <UserIcon className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={handleSignIn}
                disabled={signingIn}
                className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signingIn ? 'Checking...' : 'Sign In'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden lg:relative">
        {user ? (
          <>
            {/* Sidebar */}
            <aside className={cn(
              "fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 p-5 flex flex-col gap-8 shrink-0 z-[70] transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-0",
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
              <div className="flex items-center justify-between lg:hidden mb-2">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">NextStop Explorer</h2>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <section>
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Traveler Persona</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-xs font-semibold text-slate-800">Vibe</span>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-blue-100 text-blue-700 rounded uppercase">Adaptive</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-xs font-semibold text-slate-800">Sync Status</span>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-green-100 text-green-700 rounded uppercase">Active</span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Active Modules</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 group cursor-pointer hover:bg-slate-50 rounded-lg transition-all">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:bg-white group-hover:border-blue-200">
                      <MapIcon className="w-4 h-4 text-slate-700" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Dynamic Mapping</p>
                      <p className="text-[10px] text-slate-600 uppercase font-black">ENABLED</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 group cursor-pointer hover:bg-slate-50 rounded-lg transition-all">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:bg-white group-hover:border-blue-200">
                      <Sparkles className="w-4 h-4 text-slate-700" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Dynamic Adaptation</p>
                      <p className="text-[10px] text-slate-600 uppercase font-black">READY</p>
                    </div>
                  </div>
                </div>
              </section>

              {activeTrip && (
                <section className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Price Poll Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700">Avg Daily Burn</span>
                      <span className="text-[10px] font-black text-slate-950">$142.50</span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="w-2/3 h-full bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-bold">
                      <span className="text-slate-600">Budget Limit: $200</span>
                      <span className="text-blue-600 font-black">71% Utilized</span>
                    </div>
                    <button className="w-full mt-2 py-1.5 bg-white border border-blue-200 text-blue-600 text-[9px] font-black rounded-lg hover:bg-blue-50 transition-all uppercase tracking-widest">
                      Alternative Payouts
                    </button>
                  </div>
                </section>
              )}

                <div className="mt-auto pt-8">
                  <div className="bg-indigo-600 p-4 rounded-xl text-white shadow-lg shadow-indigo-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-3 h-3 opacity-60" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">System Logic</p>
                  </div>
                  <p className="text-[11px] leading-relaxed italic opacity-90">
                    "Weather logic enabled. I'll automatically suggest indoor detours if rain probability exceeds 70%."
                  </p>
                </div>
              </div>
            </aside>

            {/* Central View */}
            <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
               {!activeTrip ? (
                  <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
                       <header className="space-y-2">
                        <h2 className="text-3xl lg:text-4xl font-black tracking-tighter text-slate-900">Initialize Journey</h2>
                        <p className="text-slate-700 text-sm font-medium">NextStop will cross-reference schedules, conditions, and preferences.</p>
                      </header>
                      <TripPlanner onGenerationComplete={(trip) => {
                        setActiveTrip(trip);
                        setMobileMenuOpen(false);
                      }} />
                    </div>
                  </div>
               ) : (
                 <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    <div className="flex-1 p-4 lg:p-8 overflow-y-auto scrollbar-hide border-b lg:border-b-0 lg:border-r border-slate-200">
                      <ItineraryView trip={activeTrip} onUpdate={setActiveTrip} />
                    </div>

                    {/* Right Intensity Pane */}
                    <aside className="w-full lg:w-80 bg-white flex flex-col p-6 overflow-y-auto shrink-0">
                      <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6 flex justify-between items-center">
                        <span>Real-Time Intelligence</span>
                        <span className="text-blue-500 flex items-center gap-1">
                          <Activity className="w-3 h-3" /> LIVE
                        </span>
                      </h3>

                      <div className="space-y-6">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 font-bold border border-blue-100">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">Heuristic Update</p>
                            <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">Itinerary optimized for current daylight and local crowd surges.</p>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Grid View</h3>
                          <div className="w-full h-48 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                             <InteractiveMap trip={activeTrip} userLocation={userLocation} />
                          </div>
          <button 
            onClick={() => {
              if (activeTrip) setActiveTrip({...activeTrip});
            }}
            className="w-full mt-4 py-2.5 bg-slate-900 text-white text-[10px] font-black rounded-lg hover:bg-slate-800 uppercase tracking-[0.15em] transition-all"
          >
            Recalculate Route
          </button>
                        </div>
                      </div>
                    </aside>
                 </div>
               )}
            </div>
          </>
        ) : (
          /* Landing State */
          <div className="flex-1 flex items-center justify-center bg-white p-8">
            <div className="max-w-2xl text-center space-y-12">
               <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-200"
              >
                <Compass className="w-12 h-12" />
              </motion.div>
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  YOUR NEXT <br /> <span className="text-blue-600">ADVENTURE</span> STARTS HERE.
                </h2>
                <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-[10px] lg:text-xs">
                  The world's most intelligent & secure travel companion.
                </p>
              </div>
              <button 
                onClick={handleSignIn}
                disabled={signingIn}
                className="px-12 py-5 bg-slate-900 text-white rounded-full font-black uppercase tracking-[0.2em] text-sm hover:bg-blue-600 hover:scale-105 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {signingIn ? 'Authenticating...' : (
                  <span className="flex items-center gap-3">
                    Start Planning <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="h-8 bg-slate-900 text-white flex items-center justify-between px-4 text-[10px] font-mono shrink-0 select-none">
        <div className="flex gap-4 items-center overflow-hidden">
          <span className="opacity-80 whitespace-nowrap">SYNC_STATUS: <span className="text-green-400 font-bold">OPTIMIZED</span></span>
          <div className="hidden sm:block w-[1px] h-3 bg-white/10" />
          <span className="hidden lg:block opacity-80 uppercase tracking-widest font-bold">NEXTSTOP_SECURE_ENCLAVE_v2.0</span>
        </div>
        <div className="flex gap-4 lg:gap-6 items-center">
          <span className="opacity-80 hidden md:block">LOCAL_TIME: {new Date().toLocaleTimeString()}</span>
          <span className="text-blue-400 font-bold uppercase tracking-[0.1em] cursor-pointer hover:text-white transition-colors truncate max-w-[150px] lg:max-w-none">Export Logic</span>
        </div>
      </footer>
    </div>
  );
}
