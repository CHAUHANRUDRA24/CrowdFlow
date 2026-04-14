import React, { useState, useEffect } from 'react';
import { signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Shield, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkRedirect = async () => {
      setIsLoading(true);
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Redirect success", result);
        }
      } catch (err: any) {
        console.error("Redirect error:", err);
        setError(err.message || "Failed to authenticate. Have you added this domain to Firebase Authorized Domains?");
      } finally {
        setIsLoading(false);
      }
    };
    checkRedirect();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to authenticate. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-fixed/10 rounded-full blur-[128px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-surface-container-low border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-container/20 text-primary-container mb-6 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
              <Shield size={32} />
            </div>
            <h1 className="font-headline font-black text-3xl text-white tracking-tighter uppercase mb-2">
              CrowdFlow AI
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-widest uppercase">
              Secure Command Center
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-error shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-error/90 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-slate-400 shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Authorization Required</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Level 4 Clearance Protocol</p>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Authenticate with Google</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Secure Connection Established
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
