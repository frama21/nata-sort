// Public API of the media feature: format detection, metadata extraction, and
// RAW preview decoding. Everything else in this folder is private.
export { getFileFormatInfo, isPreviewable, isSupportedImage } from "./config/file-formats"
export type { FileFormatConfig } from "./config/file-formats"
export {
  extractMetadata,
  formatBitrate,
  formatDate,
  formatDuration,
  formatFileSize,
  formatTimestamp,
  parseCaptureDate
} from "./services/metadata.service"
export { decodeRawImage, decodeRawThumbnail } from "./services/raw-decoder.service"
export type { PhotoMetadata } from "./types/media.types"
