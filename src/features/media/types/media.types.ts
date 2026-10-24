/** Metadata extracted from an image (EXIF) or a video (mediainfo.js). */
export interface PhotoMetadata {
  cameraMake?: string
  cameraModel?: string
  lens?: string
  iso?: number
  shutterSpeed?: string
  aperture?: string
  focalLength?: string
  dateTaken?: string
  fileSize: number
  megapixels: number
  duration?: number
  fps?: number
  videoCodec?: string
  audioCodec?: string
  bitrate?: number
  isVideo: boolean
  dimensions: { width: number; height: number }
}
