"use client";

import { useId } from "react";

type PriceRangeSliderProps = {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (next: { min: number; max: number }) => void;
  step?: number;
};

function formatRial(n: number) {
  return `${Math.round(n).toLocaleString("fa-IR")} ریال`;
}

export function PriceRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
  step = 10_000,
}: PriceRangeSliderProps) {
  const id = useId();
  const span = Math.max(max - min, 1);
  const lo = Math.min(valueMin, valueMax);
  const hi = Math.max(valueMin, valueMax);
  const leftPct = ((lo - min) / span) * 100;
  const rightPct = ((hi - min) / span) * 100;

  function setLo(raw: number) {
    const next = Math.min(Math.max(raw, min), hi);
    onChange({ min: next, max: hi });
  }

  function setHi(raw: number) {
    const next = Math.max(Math.min(raw, max), lo);
    onChange({ min: lo, max: next });
  }

  return (
    <div className="sp-range">
      <div className="sp-range__labels" dir="ltr">
        <span>{formatRial(lo)}</span>
        <span>{formatRial(hi)}</span>
      </div>

      <div className="sp-range__track-wrap" dir="ltr">
        <div className="sp-range__rail" aria-hidden />
        <div
          className="sp-range__fill"
          style={{
            left: `${leftPct}%`,
            width: `${Math.max(rightPct - leftPct, 0)}%`,
          }}
          aria-hidden
        />
        <input
          id={`${id}-min`}
          type="range"
          className="sp-range__input sp-range__input--min"
          min={min}
          max={max}
          step={step}
          value={lo}
          aria-label="حداقل قیمت"
          onChange={(e) => setLo(Number(e.target.value))}
        />
        <input
          id={`${id}-max`}
          type="range"
          className="sp-range__input sp-range__input--max"
          min={min}
          max={max}
          step={step}
          value={hi}
          aria-label="حداکثر قیمت"
          onChange={(e) => setHi(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
