'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components';
import { OtpInput, formatCountdown, useCountdown } from '@/components/auth/OtpInput';
import {
  completePasswordLogin,
  completeRegistration,
  resendOtp,
  resetPassword,
  sendOtp,
  verifyOtp,
  type AuthResponse,
  type OtpPurpose,
  type OtpSendResponse,
} from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

type AuthMode = 'login' | 'register';
type AuthFlow = AuthMode | 'forgot_password';
type Step = 'phone' | 'otp' | 'profile' | 'password' | 'new_password';

function safeNextPath(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  if (raw.startsWith('/admin')) return null;
  return raw;
}

function normalizePhoneInput(raw: string): string {
  return raw
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '')
    .slice(0, 11);
}

function purposeForFlow(flow: AuthFlow): OtpPurpose {
  return flow === 'forgot_password' ? 'forgot_password' : flow;
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => safeNextPath(searchParams.get('next')), [searchParams]);
  const { accessToken, user, setSession, clearSession } = useAuthStore();

  const [flow, setFlow] = useState<AuthFlow>('login');
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [challengeId, setChallengeId] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  const [expiresIn, setExpiresIn] = useState(120);
  const [resendAfter, setResendAfter] = useState(60);
  const [debugCode, setDebugCode] = useState<string | undefined>();
  const [registrationToken, setRegistrationToken] = useState('');
  const [passwordToken, setPasswordToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [countdownKey, setCountdownKey] = useState(0);

  const otpRemaining = useCountdown(expiresIn, step === 'otp', countdownKey);
  const resendRemaining = useCountdown(resendAfter, step === 'otp', countdownKey);

  useEffect(() => {
    if (!accessToken || !user) return;
    if (user.role === 'admin') {
      router.replace('/admin');
      return;
    }
    router.replace(nextPath || '/account');
  }, [accessToken, user, router, nextPath]);

  const applySendResponse = useCallback((response: OtpSendResponse) => {
    setChallengeId(response.challengeId);
    setPhoneMasked(response.phoneMasked);
    setExpiresIn(response.expiresIn);
    setResendAfter(response.resendAfter);
    setDebugCode(response.debugCode);
    setOtp('');
    setError('');
    setCountdownKey((k) => k + 1);
    setStep('otp');
  }, []);

  function resetToPhone(keepPhone = true) {
    setStep('phone');
    setOtp('');
    setError('');
    setChallengeId('');
    setDebugCode(undefined);
    if (!keepPhone) setPhone('');
  }

  function switchMode(mode: AuthMode) {
    setFlow(mode);
    resetToPhone(true);
    setPassword('');
    setPasswordConfirm('');
  }

  function finishAuth(response: AuthResponse) {
    if (response.user.role === 'admin') {
      clearSession();
      setError('حساب مدیریت از این صفحه وارد نمی‌شود. لطفاً از ورود ادمین استفاده کنید.');
      resetToPhone(true);
      return;
    }
    setSession(response.accessToken, response.user);
    router.replace(nextPath || '/account');
  }

  async function handleSendPhone(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await sendOtp(phone, purposeForFlow(flow));
      applySendResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ارسال کد انجام نشد.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(codeOverride?: string) {
    const code = (codeOverride ?? otp).trim();
    if (code.length < 4) return;
    setError('');
    setIsSubmitting(true);
    try {
      const result = await verifyOtp(challengeId, code);
      if (result.nextStep === 'done') {
        finishAuth(result);
        return;
      }
      if (result.nextStep === 'profile') {
        setRegistrationToken(result.registrationToken);
        setStep('profile');
        return;
      }
      if (result.nextStep === 'password') {
        setPasswordToken(result.passwordToken);
        setStep('password');
        return;
      }
      if (result.nextStep === 'new_password') {
        setResetToken(result.resetToken);
        setStep('new_password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'اعتبارسنجی کد ناموفق بود.');
      setOtp('');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendRemaining > 0 || !challengeId) return;
    setError('');
    setIsSubmitting(true);
    try {
      applySendResponse(await resendOtp(challengeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ارسال مجدد ناموفق بود.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCompleteProfile(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      finishAuth(
        await completeRegistration({
          registrationToken,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ثبت‌نام تکمیل نشد.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordLogin(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      finishAuth(await completePasswordLogin(passwordToken, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'رمز عبور نادرست است.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(event: FormEvent) {
    event.preventDefault();
    if (password !== passwordConfirm) {
      setError('تکرار رمز عبور یکسان نیست.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      finishAuth(await resetPassword(resetToken, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تغییر رمز انجام نشد.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const copy = {
    login: {
      title: 'خوش آمدید',
      lead: 'شماره موبایل‌تان را بدهید تا کد ورود برایتان پیامک شود.',
    },
    register: {
      title: 'به خانواده MIG بپیوندید',
      lead: 'فقط با موبایل شروع کنید؛ بقیه را بعداً در پروفایل کامل می‌کنید.',
    },
    forgot_password: {
      title: 'بازیابی رمز',
      lead: 'شماره موبایل حساب را وارد کنید تا کد تأیید برایتان بیاید.',
    },
  } as const;

  const headline = copy[flow];
  const showModeTabs = flow === 'login' || flow === 'register';

  return (
    <div className="auth-stage">
      <div className="auth-stage__wash" aria-hidden />
      <div className="auth-stage__glow" aria-hidden />

      <div className="content-shell auth-shell">
        <aside className="auth-story">
          <p className="auth-story__eyebrow">MIG · پنل مشتریان</p>
          <h1 className="auth-story__brand">گروه صنعتی محمدی</h1>
          <p className="auth-story__line">
            {nextPath?.startsWith('/quote-request')
              ? 'بعد از ورود، مستقیم به درخواست قیمت برمی‌گردید.'
              : 'حسابی امن و ساده برای پیش‌فاکتور، سفارش و پیگیری همکاری با MIG.'}
          </p>
          <p className="auth-story__soft">ثبت‌نام کمتر از یک دقیقه · ورود با پیامک تأیید</p>
        </aside>

        <section className="auth-panel">
          <Link href="/" className="auth-back">
            ← بازگشت به سایت
          </Link>

          {showModeTabs ? (
            <div className="auth-pills" role="tablist" aria-label="ورود یا ثبت‌نام">
              <button
                type="button"
                role="tab"
                aria-selected={flow === 'login'}
                onClick={() => switchMode('login')}
                className={`auth-pills__btn ${flow === 'login' ? 'is-active' : ''}`}
              >
                ورود
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={flow === 'register'}
                onClick={() => switchMode('register')}
                className={`auth-pills__btn ${flow === 'register' ? 'is-active' : ''}`}
              >
                ثبت‌نام
              </button>
            </div>
          ) : (
            <button type="button" className="auth-back auth-back--inline" onClick={() => switchMode('login')}>
              ← بازگشت به ورود
            </button>
          )}

          <div className="auth-panel__head">
            <h2 className="auth-panel__title">{headline.title}</h2>
            <p className="auth-panel__lead">{headline.lead}</p>
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleSendPhone} className="auth-form">
              <label className="auth-field">
                <span className="auth-field__label">شماره موبایل</span>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  dir="ltr"
                  placeholder="0912 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
                  className="auth-field__input"
                  pattern="09[0-9]{9}"
                  title="مثال: 09121234567"
                />
              </label>
              <Button type="submit" size="lg" isLoading={isSubmitting} className="auth-cta">
                ارسال کد تأیید
              </Button>
            </form>
          ) : null}

          {step === 'otp' ? (
            <div className="auth-form">
              <div className="auth-otp-banner">
                <p className="auth-otp-banner__text">
                  کد را به <span dir="ltr">{phoneMasked}</span> فرستادیم
                </p>
                <button
                  type="button"
                  className="auth-otp-banner__edit"
                  onClick={() => resetToPhone(true)}
                >
                  اصلاح شماره
                </button>
              </div>

              <OtpInput
                length={5}
                value={otp}
                onChange={setOtp}
                onComplete={(code) => void handleVerifyOtp(code)}
                disabled={isSubmitting || otpRemaining === 0}
                autoFocus
              />

              <div className="auth-timers">
                <span>
                  اعتبار کد <strong dir="ltr">{formatCountdown(otpRemaining)}</strong>
                </span>
                {resendRemaining > 0 ? (
                  <span className="auth-timers__muted">
                    ارسال مجدد تا <strong dir="ltr">{formatCountdown(resendRemaining)}</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="auth-text-btn"
                    onClick={() => void handleResend()}
                    disabled={isSubmitting}
                  >
                    ارسال دوباره کد
                  </button>
                )}
              </div>

              {debugCode ? <p className="auth-debug">کد توسعه: {debugCode}</p> : null}

              <Button
                type="button"
                size="lg"
                isLoading={isSubmitting}
                disabled={otp.length < 5 || otpRemaining === 0}
                onClick={() => void handleVerifyOtp()}
                className="auth-cta"
              >
                تأیید و ادامه
              </Button>
            </div>
          ) : null}

          {step === 'profile' ? (
            <form onSubmit={handleCompleteProfile} className="auth-form">
              <p className="auth-soft-note">شماره تأیید شد. فقط نام‌تان را بگویید.</p>
              <div className="auth-name-grid">
                <label className="auth-field">
                  <span className="auth-field__label">نام</span>
                  <input
                    required
                    minLength={2}
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="auth-field__input auth-field__input--rtl"
                  />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">نام خانوادگی</span>
                  <input
                    required
                    minLength={2}
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="auth-field__input auth-field__input--rtl"
                  />
                </label>
              </div>
              <Button type="submit" size="lg" isLoading={isSubmitting} className="auth-cta">
                ورود به حساب
              </Button>
            </form>
          ) : null}

          {step === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="auth-form">
              <p className="auth-soft-note">ورود دو مرحله‌ای برای حساب شما فعال است.</p>
              <label className="auth-field">
                <span className="auth-field__label">رمز عبور</span>
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  dir="ltr"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-field__input"
                />
              </label>
              <Button type="submit" size="lg" isLoading={isSubmitting} className="auth-cta">
                ورود نهایی
              </Button>
            </form>
          ) : null}

          {step === 'new_password' ? (
            <form onSubmit={handleResetPassword} className="auth-form">
              <label className="auth-field">
                <span className="auth-field__label">رمز عبور جدید</span>
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  dir="ltr"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-field__input"
                />
              </label>
              <label className="auth-field">
                <span className="auth-field__label">تکرار رمز عبور</span>
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  dir="ltr"
                  minLength={8}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="auth-field__input"
                />
              </label>
              <Button type="submit" size="lg" isLoading={isSubmitting} className="auth-cta">
                ذخیره و ورود
              </Button>
            </form>
          ) : null}

          {error ? (
            <p className="auth-error" role="alert">
              {error}
              {error.includes('مدیریت') ? (
                <>
                  {' '}
                  <Link href="/admin/login" className="auth-text-btn">
                    ورود ادمین
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}

          {showModeTabs && step === 'phone' && flow === 'login' ? (
            <button
              type="button"
              className="auth-forgot"
              onClick={() => {
                setFlow('forgot_password');
                resetToPhone(true);
              }}
            >
              رمز عبور را فراموش کرده‌ام
            </button>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-stage">
          <div className="content-shell section-copy pt-28">
            <p className="auth-panel__lead">در حال آماده‌سازی…</p>
          </div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
