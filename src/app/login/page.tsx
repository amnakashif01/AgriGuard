"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf, Phone, KeyRound, UserPlus, LogIn, Shield } from 'lucide-react';
import LoadingSpinner from '@/components/agrisahayak/loading-spinner';
import { useAuth, useFirebase } from '@/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { upsertProfile } from '@/lib/repositories';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Extend window to safely store Firebase instances
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

// ─── Demo accounts for FYP presentation (bypass real SMS) ────────────────────
const DEMO_ACCOUNTS = [
  { label: 'Demo Account 1 (Admin)', phone: '03001234567', otp: '123456' },
  { label: 'Demo Account 2 (Admin)', phone: '03244149474', otp: '123456' },
];

// ─── DEMO OTP BYPASS: stored OTPs per phone ──────────────────────────────────
// Any new user who registers gets OTP: 123456 stored in Firestore
const DEMO_OTP = '123456';

export default function LoginPage() {
  const [isClient, setIsClient] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useBypass, setUseBypass] = useState(false); // true = use Firestore demo OTP
  const [pendingPhone, setPendingPhone] = useState(''); // normalized phone for bypass

  const router = useRouter();
  const { auth, db } = useFirebase();
  const { user, isUserLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if user is already logged in
  useEffect(() => {
    setIsClient(true);
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Set up the INVISIBLE reCAPTCHA
  const setupRecaptcha = useCallback(() => {
    if (!auth || window.recaptchaVerifier) return;

    try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (_response: any) => {
              // reCAPTCHA solved
            },
            'expired-callback': () => {
              setError("reCAPTCHA response expired. Please try again.");
              if (window.recaptchaVerifier) {
                  window.recaptchaVerifier.clear();
                  window.recaptchaVerifier = undefined;
              }
            }
        });
    } catch (e) {
        console.error("RecaptchaVerifier error", e);
    }
  }, [auth]);

  // Effect to initialize reCAPTCHA
  useEffect(() => {
    if (isClient && !isUserLoading && !showOtpForm) {
      setupRecaptcha();
    }

    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = undefined;
      }
    };
  }, [isClient, isUserLoading, showOtpForm, setupRecaptcha]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhone(value);
  };

  // Auto-fill phone from demo account click
  const handleDemoLogin = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setPhone(demo.phone);
    setError(null);
    toast({
      title: `✅ Demo Account Filled`,
      description: `Phone: ${demo.phone} — Click "Send OTP", then enter OTP: ${demo.otp}`,
      duration: 8000,
    });
  };

  // ─── Store OTP in Firestore for bypass login ──────────────────────────────
  const storeBypassOtp = async (normalizedPhone: string) => {
    try {
      const otpRef = doc(db, 'otp_bypass', normalizedPhone);
      await setDoc(otpRef, {
        otp: DEMO_OTP,
        phone: normalizedPhone,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
      });
      return true;
    } catch (e) {
      console.error('Failed to store bypass OTP:', e);
      return false;
    }
  };

  // ─── Verify OTP from Firestore for bypass login ───────────────────────────
  const verifyBypassOtp = async (normalizedPhone: string, enteredCode: string): Promise<boolean> => {
    try {
      const otpRef = doc(db, 'otp_bypass', normalizedPhone);
      const snap = await getDoc(otpRef);
      if (!snap.exists()) return false;
      const data = snap.data();
      // Check OTP matches and not expired
      if (data.otp !== enteredCode) return false;
      if (new Date(data.expiresAt) < new Date()) return false;
      return true;
    } catch (e) {
      console.error('Failed to verify bypass OTP:', e);
      return false;
    }
  };

  // ─── Sign in with custom Firestore-based auth (bypass) ───────────────────
  // Since we can't create users without real Firebase Auth, we use signInWithPhoneNumber
  // but with Firebase test phone numbers, and fall back to demo OTP bypass for new users.
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (phone.length < 10) {
      setError("Please enter a valid Pakistani phone number (e.g. 03217094123).");
      return;
    }

    setIsSending(true);

    if (!auth) {
      setError("Authentication service is not ready.");
      setIsSending(false);
      return;
    }

    const fullPhone = `+92${phone.replace(/^0/, '')}`;

    // Try real Firebase Phone Auth first
    if (!window.recaptchaVerifier) {
      setupRecaptcha();
    }

    try {
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier!);
      window.confirmationResult = confirmationResult;
      setUseBypass(false);
      setShowOtpForm(true);
      toast({ title: "OTP Sent", description: `An OTP has been sent to ${fullPhone}` });
    } catch (err: any) {
      console.warn("Real OTP failed, using bypass mode:", err.code, err.message);

      // ── BYPASS MODE: Store demo OTP in Firestore ─────────────────────────
      // This handles auth/billing-not-enabled, auth/too-many-requests, etc.
      if (
        err.code === 'auth/billing-not-enabled' ||
        err.code === 'auth/too-many-requests' ||
        err.code === 'auth/quota-exceeded' ||
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/captcha-check-failed' ||
        err.code === 'auth/missing-phone-number'
      ) {
        const ok = await storeBypassOtp(fullPhone);
        if (ok) {
          setPendingPhone(fullPhone);
          setUseBypass(true);
          setShowOtpForm(true);
          toast({
            title: "✅ Demo OTP Ready",
            description: `Enter the demo OTP: ${DEMO_OTP} to sign in.`,
            duration: 8000,
          });
        } else {
          setError('Could not prepare login. Please check your connection.');
        }
      } else {
        setError(err.message || 'Failed to send OTP. Please check the phone number and try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    try {
      if (useBypass) {
        // ── Bypass OTP verification ─────────────────────────────────────────
        const valid = await verifyBypassOtp(pendingPhone, code);
        if (!valid) {
          setError(`Invalid OTP. Please enter: ${DEMO_OTP}`);
          setIsVerifying(false);
          return;
        }

        // Use signInWithPhoneNumber with a known test number that Firebase allows
        // OR: sign the user in via a custom token approach
        // Since we can't create users without auth, we attempt real sign-in again
        // but first try the demo accounts if phone matches
        const demoAccount = DEMO_ACCOUNTS.find(d => {
          const normalized = `+92${d.phone.replace(/^0/, '')}`;
          return normalized === pendingPhone;
        });

        if (demoAccount && window.confirmationResult) {
          // This path should rarely hit since bypass is triggered when confirmationResult fails
          try {
            const cred = await window.confirmationResult.confirm(code);
            const loggedInUser = cred.user;
            await upsertProfile({ uid: loggedInUser.uid, phone: loggedInUser.phoneNumber! });
            toast({ title: "Login Successful!", description: "Welcome to AgriGuard.", className: "bg-green-100 text-green-800" });
            router.push('/dashboard');
            return;
          } catch {
            // fall through
          }
        }

        // For non-demo phones in bypass mode, we need to create a session manually.
        // Since Firebase doesn't allow passwordless creation without billing,
        // we store the user profile in Firestore and use a session token approach.
        // Store the session in localStorage so the app can detect it
        const sessionData = {
          uid: `demo_${pendingPhone.replace(/\+/g, '')}`,
          phone: pendingPhone,
          isDemoSession: true,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('agriguard_demo_session', JSON.stringify(sessionData));

        // Upsert profile using demo UID
        await upsertProfile({ uid: sessionData.uid, phone: pendingPhone });

        toast({ title: "Login Successful!", description: "Welcome to AgriGuard.", className: "bg-green-100 text-green-800" });

        // Force page reload to let the app pick up the demo session
        window.location.href = '/dashboard';
      } else {
        // ── Real Firebase Phone Auth verification ───────────────────────────
        if (!window.confirmationResult) {
          setError("Verification session expired. Please request a new OTP.");
          setIsVerifying(false);
          return;
        }
        const cred = await window.confirmationResult.confirm(code);
        const loggedInUser = cred.user;
        await upsertProfile({ uid: loggedInUser.uid, phone: loggedInUser.phoneNumber! });
        toast({ title: "Login Successful!", description: "Welcome to AgriGuard.", className: "bg-green-100 text-green-800" });
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error("OTP Verify Error:", err);
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isClient || isUserLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md space-y-4">

        {/* Main Login Card */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 w-fit mb-4 shadow-lg">
              <Leaf className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-headline bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
              Welcome to AgriGuard
            </CardTitle>
            <CardDescription className="text-gray-500">
              {showOtpForm
                ? 'Enter the OTP sent to your phone'
                : 'Sign in or sign up with your phone number'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showOtpForm ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    Phone Number
                  </Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-emerald-50 text-emerald-700 text-sm font-bold">
                      +92
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0321 7094123"
                      required
                      className="rounded-l-none focus:ring-emerald-500 focus:border-emerald-500"
                      value={phone}
                      onChange={handlePhoneChange}
                      pattern="\d{10,11}"
                      title="Please enter your Pakistani phone number (10-11 digits, e.g. 03217094123)."
                    />
                  </div>
                  <p className="text-xs text-gray-400">Enter any valid Pakistani phone number to register or sign in</p>
                </div>

                {/* Invisible reCAPTCHA Container */}
                <div id="recaptcha-container"></div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600 text-center">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={isSending || phone.length < 10}
                >
                  {isSending ? (
                    <LoadingSpinner message="Sending OTP..." />
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Send OTP
                    </span>
                  )}
                </Button>

                <div className="text-center text-xs text-gray-400 flex items-center gap-2 justify-center">
                  <UserPlus className="h-3 w-3" />
                  New users are automatically registered
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="code" className="flex items-center gap-2 text-sm font-semibold">
                    <KeyRound className="h-4 w-4 text-emerald-600" />
                    Enter OTP
                  </Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus
                    className="text-center text-2xl tracking-widest font-bold focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {useBypass && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                      <p className="text-xs text-emerald-700 font-medium">
                        🔑 Demo OTP code: <span className="font-bold text-emerald-800 text-sm">123456</span>
                      </p>
                    </div>
                  )}
                  {!useBypass && (
                    <p className="text-xs text-muted-foreground text-center">
                      💡 Demo OTP code is: <span className="font-bold text-primary">123456</span>
                    </p>
                  )}
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600 text-center">{error}</p>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-bold py-3 rounded-xl shadow-lg"
                  disabled={isVerifying || code.length < 6}
                >
                  {isVerifying ? <LoadingSpinner message="Verifying..." /> : (
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Verify & Continue
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-gray-500 hover:text-emerald-700"
                  onClick={() => { setShowOtpForm(false); setCode(''); setError(null); setUseBypass(false); }}
                >
                  ← Use a different number
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* FYP Demo Access Card */}
        {!showOtpForm && (
          <Card className="border-2 border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-600 shadow-lg">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                  🎓 FYP Demo
                </span>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  One-Click Demo Login
                </p>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                Click a demo account below → Then click <strong>&quot;Send OTP&quot;</strong> → Enter OTP: <strong className="text-primary">123456</strong>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((demo) => (
                  <button
                    key={demo.phone}
                    type="button"
                    onClick={() => handleDemoLogin(demo)}
                    className="flex flex-col items-start p-3 rounded-lg bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-500 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md"
                  >
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                      {demo.label}
                    </span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-0.5">
                      {demo.phone}
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400 mt-1">
                      OTP: {demo.otp} ✓
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-4 text-center text-xs text-muted-foreground bg-green-50/50 p-2 rounded-lg border border-green-100">
                Developed by <span className="font-semibold text-green-700">Ayesha &amp; Amna</span> (FYP Students)
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
