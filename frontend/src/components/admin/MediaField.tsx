'use client';

import { useState } from 'react';
import { IconAction, IconClear } from '@/components/admin/AdminIcons';
import { MediaPicker } from '@/components/admin/MediaPicker';
import { isVideoMedia, resolveMediaUrl } from '@/lib/media';

type SingleProps = {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
};

type MultiProps = {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
};

type MediaFieldProps = {
  label: string;
  accept?: 'all' | 'image' | 'video';
  placeholder?: string;
} & (SingleProps | MultiProps);

function looksLikeVideo(url: string): boolean {
  return (
    isVideoMedia(
      url.includes('.mp4')
        ? 'video/mp4'
        : url.includes('.webm')
          ? 'video/webm'
          : url.includes('.mov')
            ? 'video/quicktime'
            : '',
    ) || /\.(mp4|webm|mov|ogv)(\?|$)/i.test(url)
  );
}

export function MediaField(props: MediaFieldProps) {
  const {
    label,
    accept = 'image',
    placeholder = 'از کتابخانه انتخاب شود یا آدرس وارد شود',
  } = props;
  const multiple = props.multiple === true;
  const [open, setOpen] = useState(false);

  const urls = multiple
    ? props.value
    : props.value.trim()
      ? [props.value.trim()]
      : [];

  function removeAt(index: number) {
    if (multiple) {
      props.onChange(props.value.filter((_, i) => i !== index));
      return;
    }
    props.onChange('');
  }

  function applySelection(selected: string[]) {
    if (multiple) {
      const merged = Array.from(new Set([...props.value, ...selected.map((item) => item.trim()).filter(Boolean)]));
      props.onChange(merged);
      return;
    }
    props.onChange(selected[0] ?? '');
  }

  return (
    <div className="media-field block text-start">
      <div className="media-field__head">
        <span className="ops-login__label">{label}</span>
        <button type="button" className="ops-btn ops-btn--ghost shrink-0" onClick={() => setOpen(true)}>
          کتابخانه
        </button>
      </div>

      {!multiple ? (
        <input
          className="ops-field"
          dir="ltr"
          placeholder={placeholder}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        />
      ) : null}

      {urls.length > 0 ? (
        <div className={`media-field__gallery ${multiple ? 'is-multi' : 'is-single'}`}>
          {urls.map((url, index) => {
            const src = resolveMediaUrl(url);
            const video = looksLikeVideo(url);
            return (
              <div key={`${url}-${index}`} className="media-field__thumb">
                {video ? (
                  <video src={src} muted playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" />
                )}
                <IconAction
                  label="حذف تصویر"
                  tone="danger"
                  className="media-field__remove"
                  onClick={() => removeAt(index)}
                >
                  <IconClear />
                </IconAction>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="media-field__empty">هنوز تصویری انتخاب نشده است.</p>
      )}

      <MediaPicker
        open={open}
        multiple={multiple}
        accept={accept}
        onClose={() => setOpen(false)}
        onSelect={(selected) => applySelection(selected)}
      />
    </div>
  );
}
