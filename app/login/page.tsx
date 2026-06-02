'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ShieldCheck, Lock, ArrowLeft, Phone, KeyRound } from 'lucide-react';

const DEFAULT_COUNTRY_CODE = '+998';

export default function LoginPage() {
  const router = useRouter();
  const countryCode = DEFAULT_COUNTRY_CODE;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const sendOtpMutation = useMutation({
    mutationFn: authService.sendOtp,
    onSuccess: () => {
      toast.success('OTP sent successfully!');
      setStep('otp');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to send OTP');
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: authService.verifyOtp,
    onSuccess: (data) => {
      if (data.user.role !== 'ADMIN') {
        toast.error('Access denied. Only admins can access this panel.');
        return;
      }
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Welcome to admin panel!');
      router.push('/dashboard');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Invalid OTP code');
    },
  });

  const normalizedCountryCode = countryCode.startsWith('+') ? countryCode : `+${countryCode.replace(/\D/g, '') || '998'}`;
  const localNumber = phoneNumber.replace(/\D/g, '');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localNumber) return;
    sendOtpMutation.mutate({
      countryCode: normalizedCountryCode,
      phoneNumber: localNumber,
      forAdminPanel: true,
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localNumber) return;
    const code = parseInt(otpCode, 10);
    verifyOtpMutation.mutate({
      countryCode: normalizedCountryCode,
      phoneNumber: localNumber,
      code,
    });
  };

  const labelClass = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.07),transparent)]" />

      <div className="w-full max-w-sm animate-slide-up relative">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Second Bloom</h1>
            <p className="text-[11px] text-slate-400 mt-1 font-medium tracking-wider uppercase">Admin Panel</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Step indicator */}
          <div className="px-7 pt-6 pb-0">
            <div className="flex items-center gap-2 mb-5">
              <div className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${step === 'phone' ? 'bg-slate-900' : 'bg-slate-900'}`} />
              <div className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${step === 'otp' ? 'bg-slate-900' : 'bg-slate-200'}`} />
            </div>
          </div>

          <div className="px-7 pb-7">
            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-0.5">Sign in</p>
                  <p className="text-xs text-slate-400 mb-5">Enter your phone number to continue</p>

                  <label htmlFor="country-code" className={labelClass}>
                    Country code
                  </label>
                  <div className="relative mb-3">
                    <input
                      id="country-code"
                      type="tel"
                      value={countryCode}
                      readOnly
                      tabIndex={-1}
                      className="input-premium w-full cursor-not-allowed text-slate-400 font-semibold"
                      autoComplete="tel-country-code"
                      aria-readonly="true"
                    />
                  </div>

                  <label htmlFor="phone-number" className={labelClass}>
                    Phone number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.5} />
                    <input
                      id="phone-number"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="input-premium w-full pl-11 font-semibold text-slate-900"
                      placeholder="904440041"
                      autoComplete="tel-national"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="btn-premium w-full h-11 rounded-xl font-semibold text-sm mt-1"
                  isLoading={sendOtpMutation.isPending}
                  disabled={!localNumber.length}
                >
                  Continue
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-0.5">Verify</p>
                  <p className="text-xs text-slate-400 mb-5">
                    Code sent to {normalizedCountryCode} {localNumber}
                  </p>

                  <label htmlFor="otp-code" className={labelClass}>
                    One-time code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.5} />
                    <input
                      id="otp-code"
                      type="text"
                      inputMode="numeric"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="input-premium w-full pl-11 font-mono font-bold text-slate-900 tracking-[0.3em] text-center"
                      placeholder="• • • • • •"
                      maxLength={6}
                      autoComplete="one-time-code"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setOtpCode(''); }}
                    className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
                    aria-label="Back"
                  >
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <Button
                    type="submit"
                    className="btn-premium flex-1 h-11 rounded-xl font-semibold text-sm"
                    isLoading={verifyOtpMutation.isPending}
                    disabled={otpCode.length < 6}
                  >
                    Sign in
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-slate-400">
          <Lock className="w-3 h-3" strokeWidth={1.5} />
          <span className="text-[11px]">Secured with OTP</span>
        </div>
      </div>
    </div>
  );
}
