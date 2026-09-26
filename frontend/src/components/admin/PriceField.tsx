"use client";

type PriceFieldProps = {
  label?: string;
  value: string | number;
  negotiable: boolean;
  onValueChange: (value: string) => void;
  onNegotiableChange: (negotiable: boolean) => void;
  placeholder?: string;
  optional?: boolean;
};

/**
 * Compact price metabox control: label + توافقی switch on one row, amount below.
 */
export function PriceField({
  label = "قیمت (ریال)",
  value,
  negotiable,
  onValueChange,
  onNegotiableChange,
  placeholder,
  optional = false,
}: PriceFieldProps) {
  return (
    <div className={`admin-price-field${negotiable ? " is-negotiable" : ""}`}>
      <div className="admin-price-field__head">
        <span className="admin-price-field__label">
          {label}
          {optional ? (
            <span className="admin-price-field__optional">اختیاری</span>
          ) : null}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={negotiable}
          className={`admin-price-switch${negotiable ? " is-on" : ""}`}
          onClick={() => onNegotiableChange(!negotiable)}
        >
          <span className="admin-price-switch__track" aria-hidden>
            <span className="admin-price-switch__thumb" />
          </span>
          <span className="admin-price-switch__text">توافقی</span>
        </button>
      </div>

      {negotiable ? (
        <div className="admin-price-field__negotiable" aria-live="polite">
          <span className="admin-price-field__badge">توافقی</span>
          <span className="admin-price-field__hint">
            در سایت به‌جای مبلغ ریالی نمایش داده می‌شود.
          </span>
        </div>
      ) : (
        <input
          type="number"
          min={0}
          className="ops-field admin-price-field__input"
          dir="ltr"
          placeholder={
            placeholder ?? (optional ? "خالی = بدون نمایش قیمت" : undefined)
          }
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        />
      )}
    </div>
  );
}
