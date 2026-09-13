'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  buildYearRange,
  formatJalali,
  isoToJalali,
  jalaliToIso,
  jalaaliMonthLength,
  PERSIAN_MONTHS,
  todayJalali,
  toFaDigits,
  type JalaliParts,
} from '@/lib/jalali';

const ITEM_H = 40;
const VISIBLE = 5;
const PAD = Math.floor(VISIBLE / 2);
const PANEL_GAP = 8;
const PANEL_EST_HEIGHT = 320;

type WheelItem = { value: number; label: string };

type WheelColumnProps = {
  ariaLabel: string;
  items: WheelItem[];
  value: number;
  onChange: (value: number) => void;
};

function WheelColumn({ ariaLabel, items, value, onChange }: WheelColumnProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const itemsRef = useRef(items);
  const valueRef = useRef(value);
  const ignoreScrollRef = useRef(false);
  const settleTimerRef = useRef(0);

  onChangeRef.current = onChange;
  itemsRef.current = items;
  valueRef.current = value;

  const valueIndex = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  );

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const el = scrollerRef.current;
    if (!el) return;
    ignoreScrollRef.current = true;
    el.scrollTo({ top: index * ITEM_H, behavior });
    window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      ignoreScrollRef.current = false;
    }, behavior === 'smooth' ? 320 : 50);
  }, []);

  useLayoutEffect(() => {
    scrollToIndex(valueIndex, 'auto');
  }, [valueIndex, items.length, scrollToIndex]);

  const commitNearest = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || ignoreScrollRef.current) return;
    const list = itemsRef.current;
    if (!list.length) return;
    const index = Math.max(0, Math.min(list.length - 1, Math.round(el.scrollTop / ITEM_H)));
    const targetTop = index * ITEM_H;
    if (Math.abs(el.scrollTop - targetTop) > 0.5) {
      ignoreScrollRef.current = true;
      el.scrollTo({ top: targetTop, behavior: 'smooth' });
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(() => {
        ignoreScrollRef.current = false;
      }, 280);
    }
    const next = list[index];
    if (next && next.value !== valueRef.current) {
      onChangeRef.current(next.value);
    }
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let debounce = 0;
    function onScroll() {
      if (ignoreScrollRef.current) return;
      window.clearTimeout(debounce);
      debounce = window.setTimeout(commitNearest, 80);
    }

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scrollend', commitNearest);
    return () => {
      window.clearTimeout(debounce);
      window.clearTimeout(settleTimerRef.current);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', commitNearest);
    };
  }, [commitNearest]);

  return (
    <div className="persian-date-wheel">
      <div className="persian-date-wheel__label">{ariaLabel}</div>
      <div className="persian-date-wheel__viewport" style={{ height: ITEM_H * VISIBLE }}>
        <div className="persian-date-wheel__fade persian-date-wheel__fade--top" aria-hidden />
        <div className="persian-date-wheel__fade persian-date-wheel__fade--bottom" aria-hidden />
        <div className="persian-date-wheel__highlight" aria-hidden style={{ height: ITEM_H, top: ITEM_H * PAD }} />
        <div
          ref={scrollerRef}
          className="persian-date-wheel__scroller"
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
            event.preventDefault();
            const delta = event.key === 'ArrowDown' ? 1 : -1;
            const nextIndex = Math.max(0, Math.min(items.length - 1, valueIndex + delta));
            const next = items[nextIndex];
            if (!next) return;
            onChange(next.value);
            scrollToIndex(nextIndex, 'smooth');
          }}
        >
          <div style={{ height: ITEM_H * PAD }} aria-hidden />
          {items.map((item) => {
            const selected = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={`persian-date-wheel__item${selected ? ' is-selected' : ''}`}
                style={{ height: ITEM_H }}
                onClick={() => {
                  onChange(item.value);
                  const index = items.findIndex((entry) => entry.value === item.value);
                  if (index >= 0) scrollToIndex(index, 'smooth');
                }}
              >
                {item.label}
              </button>
            );
          })}
          <div style={{ height: ITEM_H * PAD }} aria-hidden />
        </div>
      </div>
    </div>
  );
}

type PanelPlacement = {
  top: number;
  left: number;
  width: number;
  placement: 'above' | 'below';
};

function computePlacement(trigger: HTMLElement, panelHeight = PANEL_EST_HEIGHT): PanelPlacement {
  const rect = trigger.getBoundingClientRect();
  const width = Math.max(rect.width, 280);
  const viewportH = window.innerHeight;
  const viewportW = window.innerWidth;
  const spaceBelow = viewportH - rect.bottom - PANEL_GAP;
  const spaceAbove = rect.top - PANEL_GAP;
  const placement: 'above' | 'below' =
    spaceBelow < panelHeight && spaceAbove > spaceBelow ? 'above' : 'below';

  let left = rect.left;
  if (left + width > viewportW - 8) left = Math.max(8, viewportW - width - 8);
  if (left < 8) left = 8;

  const top =
    placement === 'below'
      ? rect.bottom + PANEL_GAP
      : Math.max(8, rect.top - PANEL_GAP - panelHeight);

  return { top, left, width, placement };
}

export function PersianDatePicker({
  value,
  onChange,
  label,
  placeholder = 'انتخاب تاریخ شمسی',
  minYear = 1300,
  maxYear,
  allowClear = true,
}: {
  value: string;
  onChange: (isoDate: string) => void;
  label?: string;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<PanelPlacement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const years = useMemo(() => buildYearRange(minYear, maxYear), [minYear, maxYear]);

  const [draft, setDraft] = useState<JalaliParts>(() => isoToJalali(value) ?? todayJalali());

  const updatePlacement = useCallback(() => {
    if (!triggerRef.current) return;
    const measured = panelRef.current?.offsetHeight || PANEL_EST_HEIGHT;
    setPlacement(computePlacement(triggerRef.current, measured));
  }, []);

  useEffect(() => {
    if (open) setDraft(isoToJalali(value) ?? todayJalali());
  }, [open, value]);

  useLayoutEffect(() => {
    if (!open) {
      setPlacement(null);
      return;
    }
    updatePlacement();
    // Remeasure after paint so above/below uses real panel height.
    const frame = window.requestAnimationFrame(updatePlacement);
    return () => window.cancelAnimationFrame(frame);
  }, [open, updatePlacement]);

  useEffect(() => {
    if (!open) return;

    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    function onReposition() {
      updatePlacement();
    }

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, updatePlacement]);

  const dayCount = jalaaliMonthLength(draft.jy, draft.jm);

  const days = useMemo(
    () =>
      Array.from({ length: dayCount }, (_, index) => {
        const day = index + 1;
        return { value: day, label: toFaDigits(day) };
      }),
    [dayCount],
  );

  const months = useMemo(
    () =>
      PERSIAN_MONTHS.map((name, index) => ({
        value: index + 1,
        label: name,
      })),
    [],
  );

  const yearItems = useMemo(
    () => years.map((year) => ({ value: year, label: toFaDigits(year) })),
    [years],
  );

  useEffect(() => {
    if (draft.jd > dayCount) {
      setDraft((current) => ({ ...current, jd: dayCount }));
    }
  }, [dayCount, draft.jd]);

  function emit(next: JalaliParts) {
    const safeDay = Math.min(next.jd, jalaaliMonthLength(next.jy, next.jm));
    onChange(jalaliToIso(next.jy, next.jm, safeDay));
  }

  function updateDraft(patch: Partial<JalaliParts>) {
    const next = { ...draft, ...patch };
    const maxDay = jalaaliMonthLength(next.jy, next.jm);
    next.jd = Math.min(next.jd, maxDay);
    setDraft(next);
    emit(next);
  }

  const display = value ? formatJalali(value, true) : '';

  const portalHost =
    typeof document !== 'undefined'
      ? document.querySelector('.admin-modal') ?? document.querySelector('.mig-ops') ?? document.body
      : null;

  const panel =
    open && placement && portalHost
      ? createPortal(
          <div
            ref={panelRef}
            className={`persian-date__panel persian-date__panel--float persian-date__panel--${placement.placement}`}
            role="dialog"
            aria-label={label || 'انتخاب تاریخ شمسی'}
            dir="rtl"
            style={{
              top: placement.top,
              left: placement.left,
              width: placement.width,
            }}
          >
            <div className="persian-date__columns">
              <WheelColumn
                ariaLabel="روز"
                items={days}
                value={Math.min(draft.jd, dayCount)}
                onChange={(jd) => updateDraft({ jd })}
              />
              <WheelColumn
                ariaLabel="ماه"
                items={months}
                value={draft.jm}
                onChange={(jm) => updateDraft({ jm })}
              />
              <WheelColumn
                ariaLabel="سال"
                items={yearItems}
                value={draft.jy}
                onChange={(jy) => updateDraft({ jy })}
              />
            </div>
            <div className="persian-date__actions">
              {allowClear ? (
                <button
                  type="button"
                  className="ops-btn ops-btn--ghost persian-date__action"
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  پاک کردن
                </button>
              ) : (
                <span />
              )}
              <button type="button" className="ops-btn persian-date__action" onClick={() => setOpen(false)}>
                تأیید
              </button>
            </div>
          </div>,
          portalHost,
        )
      : null;

  return (
    <div className="persian-date" ref={rootRef}>
      {label ? <span className="ops-login__label">{label}</span> : null}
      <button
        ref={triggerRef}
        type="button"
        className={`ops-field persian-date__trigger${open ? ' is-open' : ''}${value ? '' : ' is-empty'}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{display || placeholder}</span>
        <span className="persian-date__chevron" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>
      {panel}
    </div>
  );
}
