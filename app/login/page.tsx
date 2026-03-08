'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const DEFAULT_COUNTRY_CODE = '+998';

export default function LoginPage() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
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
  const inputClass =
    'h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all';
  const labelClass = 'block text-sm font-bold text-gray-700 mb-2';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-purple-50/80 p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <span className="text-3xl" aria-hidden>🌸</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-sm">
              Sign in to access the admin panel
            </p>
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="country-code" className={labelClass}>
                  Country code
                </label>
                <input
                  id="country-code"
                  type="tel"
                  value={countryCode}
                  readOnly
                  tabIndex={-1}
                  className={`${inputClass} bg-gray-100 cursor-not-allowed border-gray-200`}
                  placeholder="+998"
                  autoComplete="tel-country-code"
                  aria-readonly="true"
                />
              </div>
              <div>
                <label htmlFor="phone-number" className={labelClass}>
                  Phone number
                </label>
                <input
                  id="phone-number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className={inputClass}
                  placeholder="904440041"
                  autoComplete="tel-national"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold focus:ring-purple-500 border-0"
                isLoading={sendOtpMutation.isPending}
                disabled={!localNumber.length}
              >
                Send OTP Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otp-code" className={labelClass}>
                  OTP Code
                </label>
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className={inputClass}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('phone');
                    setOtpCode('');
                  }}
                  className="flex-1 h-11 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-purple-500 hover:text-purple-600"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold border-0"
                  isLoading={verifyOtpMutation.isPending}
                  disabled={otpCode.length < 6}
                >
                  Verify
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 inline-flex items-center gap-1.5">
              <span aria-hidden>🔒</span>
              Secure login with OTP verification
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
