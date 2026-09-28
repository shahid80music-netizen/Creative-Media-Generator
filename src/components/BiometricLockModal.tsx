import React, { useState } from 'react';
import { Fingerprint, Lock, ShieldCheck, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BiometricLockModal: React.FC = () => {
  const { unlockApp } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  const handleBiometricTap = async () => {
    const success = await unlockApp();
    if (!success) {
      setError(true);
    }
  };

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await unlockApp(passcode);
    if (!success) {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
          <Fingerprint className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Biometric Security Lock
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your personalized dashboard &amp; tasks are locked. Authenticate to proceed.
          </p>
        </div>

        {/* Biometric trigger button */}
        <button
          onClick={handleBiometricTap}
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Fingerprint className="w-4 h-4" />
          <span>Tap to Authenticate Biometrics</span>
        </button>

        {/* Passcode alternative */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <p className="text-[11px] text-slate-400">Or unlock with Security PIN (default: 1234):</p>
          <form onSubmit={handlePasscodeSubmit} className="flex gap-2">
            <input
              type="password"
              maxLength={8}
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(false);
              }}
              placeholder="PIN code..."
              className="flex-1 px-3 py-2 text-center tracking-widest text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Unlock
            </button>
          </form>
          {error && <p className="text-xs text-rose-500">Invalid PIN or authentication declined.</p>}
        </div>
      </div>
    </div>
  );
};
