'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

function toAsciiDigits(raw: string): string {
  return raw
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '');
}

export function OtpInput({
  length = 5,
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
  }, [autoFocus]);

  const setAt = useCallback(
    (index: number, char: string) => {
      const next = digits.map((d, i) => (i === index ? char : d));
      const joined = next.join('').slice(0, length);
      onChange(joined);
      if (joined.length === length) onComplete?.(joined);
    },
    [digits, length, onChange, onComplete],
  );

  function handleChange(index: number, raw: string) {
    const cleaned = toAsciiDigits(raw);
    if (!cleaned) {
      setAt(index, '');
      return;
    }
    if (cleaned.length > 1) {
      const merged = (value.slice(0, index) + cleaned).slice(0, length);
      onChange(merged);
      const focusIdx = Math.min(merged.length, length - 1);
      inputsRef.current[focusIdx]?.focus();
      if (merged.length === length) onComplete?.(merged);
      return;
    }
    setAt(index, cleaned);
    if (index < length - 1) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
      setAt(index - 1, '');
      event.preventDefault();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
      event.preventDefault();
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
      event.preventDefault();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = toAsciiDigits(event.clipboardData.getData('text')).slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    inputsRef.current[Math.min(pasted.length, length) - 1]?.focus();
    if (pasted.length === length) onComplete?.(pasted);
  }

  return (
    <div className="otp-grid" dir="ltr" role="group" aria-label="کد تأیید">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={digit}
          disabled={disabled}
          aria-label={`رقم ${index + 1}`}
          className="otp-cell"
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Restarts whenever `resetKey` changes. */
export function useCountdown(seconds: number, active: boolean, resetKey = 0) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds, resetKey]);

  useEffect(() => {
    if (!active) return;
    if (remaining <= 0) return;
    const id = window.setTimeout(() => setRemaining((v) => v - 1), 1000);
    return () => window.clearTimeout(id);
  }, [active, remaining]);

  return remaining;
}
