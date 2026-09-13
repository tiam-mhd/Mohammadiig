export type MediaCompressionSettings = {
  /** JPEG/WebP quality 1–100 */
  quality: number;
  maxWidth: number;
  maxHeight: number;
  /** Prefer WebP output when compressing */
  convertToWebp: boolean;
  /** Strip EXIF / ICC when compressing */
  stripMetadata: boolean;
  /** Compress on upload using these defaults */
  compressOnUpload: boolean;
};

export const DEFAULT_MEDIA_SETTINGS: MediaCompressionSettings = {
  quality: 82,
  maxWidth: 1920,
  maxHeight: 1920,
  convertToWebp: true,
  stripMetadata: true,
  compressOnUpload: false,
};

export function clampSettings(input: Partial<MediaCompressionSettings>): MediaCompressionSettings {
  const quality = Math.min(100, Math.max(1, Math.round(Number(input.quality ?? DEFAULT_MEDIA_SETTINGS.quality))));
  const maxWidth = Math.min(8000, Math.max(100, Math.round(Number(input.maxWidth ?? DEFAULT_MEDIA_SETTINGS.maxWidth))));
  const maxHeight = Math.min(8000, Math.max(100, Math.round(Number(input.maxHeight ?? DEFAULT_MEDIA_SETTINGS.maxHeight))));
  return {
    quality,
    maxWidth,
    maxHeight,
    convertToWebp: Boolean(input.convertToWebp ?? DEFAULT_MEDIA_SETTINGS.convertToWebp),
    stripMetadata: Boolean(input.stripMetadata ?? DEFAULT_MEDIA_SETTINGS.stripMetadata),
    compressOnUpload: Boolean(input.compressOnUpload ?? DEFAULT_MEDIA_SETTINGS.compressOnUpload),
  };
}
