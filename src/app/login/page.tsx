"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf } from 'lucide-react';
import LoadingSpinner from '@/components/agrisahayak/loading-spinner';
import { useAuth, useFirebase } from '@/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { upsertProfile } from '@/lib/repositories';

// Extend window to safely store Firebase instances
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

// Demo accounts for FYP presentation
const DEMO_ACCOUNTS = [
  { label: 'Demo Account 1', phone: '03001234567', otp: '123456' },
  { label: 'Demo Account 2', phone: '03244149474', otp: '123456' },
];

export default function LoginPage() {
  const [isClient, setIsClient] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { auth } = useFirebase();
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
            'callback': (response: any) => {
              // reCAPTCHA solved, signInWithPhoneNumber will proceed automatically
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
    // Pakistani numbers are 11 digits (e.g. 03217094123), allow up to 11
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
  
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Pakistani numbers: 11 digits with leading 0 (e.g. 03217094123)
    // or 10 digits without leading 0 (e.g. 3217094123)
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

    if (!window.recaptchaVerifier) {
      setupRecaptcha();
    }
    
    try {
      const fullPhone = `+92${phone.replace(/^0/, '')}`;
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier!);
      
      window.confirmationResult = confirmationResult;
      setShowOtpForm(true);
      toast({ title: "OTP Sent", description: `An OTP has been sent to ${fullPhone}` });

    } catch (err: any) {
      console.error("OTP Send Error:", err);
      setError(err.message || 'Failed to send OTP. Please check the phone number and try again.');
      // Do NOT clear the verifier here. If it fails (e.g. auth not enabled), we want to keep it 
      // so the user can just click "Send OTP" again without the "already rendered" error.
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirmationResult) {
      setError("Verification session expired. Please request a new OTP.");
      return;
    }
    setError(null);
    setIsVerifying(true);

    try {
      const cred = await window.confirmationResult.confirm(code);
      const loggedInUser = cred.user;
      
      await upsertProfile({ uid: loggedInUser.uid, phone: loggedInUser.phoneNumber! });

      toast({ title: "Login Successful!", description: "Welcome to AgriGuard.", className: "bg-green-100 text-green-800" });
      router.push('/dashboard');
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
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-4">

        {/* Main Login Card */}
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
              <Leaf className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">Welcome to AgriGuard</CardTitle>
            <CardDescription>Secure sign-in with your phone number.</CardDescription>
          </CardHeader>
          <CardContent>
            {!showOtpForm ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-secondary text-secondary-foreground text-sm">
                      +92
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0321 7094123"
                      required
                      className="rounded-l-none"
                      value={phone}
                      onChange={handlePhoneChange}
                      pattern="\d{10,11}"
                      title="Please enter your Pakistani phone number (10-11 digits, e.g. 03217094123)."
                    />
                  </div>
                </div>
                
                {/* Invisible reCAPTCHA Container */}
                <div id="recaptcha-container"></div>

                {error && (<p className="text-sm text-destructive my-2 text-center">{error}</p>)}

                <Button type="submit" className="w-full" disabled={isSending || phone.length < 10} >
                  {isSending ? <LoadingSpinner message="Sending OTP..." /> : 'Send OTP'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="code">Enter OTP</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Demo OTP code is: <span className="font-bold text-primary">123456</span>
                  </p>
                </div>
                {error && (<p className="text-sm text-destructive my-2">{error}</p>)}
                <Button type="submit" className="w-full" disabled={isVerifying || code.length < 6}>
                  {isVerifying ? <LoadingSpinner message="Verifying..." /> : 'Verify & Continue'}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => { setShowOtpForm(false); setCode(''); setError(null); }}>
                  Use a different number
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
              <div className="mt-6 text-center text-xs text-muted-foreground bg-green-50/50 p-2 rounded-lg border border-green-100">
                Developed by <span className="font-semibold text-green-700">Ayesha & Amna</span> (FYP Students)
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
