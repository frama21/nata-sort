# Feature: media

Everything about reading media files, with no UI and no routes:

- **Format registry:** which extensions are supported or previewable, and their category.
- **Metadata extraction:** EXIF via ExifReader for images, mediainfo.js for
  video, and date parsing.
- **RAW previews:** the largest embedded JPEG first, with a `libraw-wasm`
  fallback. The worker is patched, and decodes have a timeout.

| | |
| --- | --- |
| **Routes** | none |
| **Public API** | `index.ts`: `getFileFormatInfo`, `isSupportedImage`, `isPreviewable`, `extractMetadata`, `parseCaptureDate`, `format*` helpers, `decodeRawImage`, `decodeRawThumbnail`, types `FileFormatConfig`, `PhotoMetadata` |
| **Depends on** | `exifreader`, `mediainfo.js`, `libraw-wasm` |
| **Depended on by** | `sorter` (required) |

Only the public API above may be imported from outside this folder
(`@/features/media`). Add support for a new file type in `config/file-formats.ts`
only; never hard-code extension checks elsewhere.

## Tests

```bash
pnpm vitest run src/features/media
```

## Removing it

`sorter` requires this feature. Deleting it makes `pnpm typecheck` and
`pnpm check:architecture` fail with unresolved `@/features/media` imports in
`sorter`, and the failure is reported at build time, not at runtime. To remove
it, first move what `sorter` uses into `sorter` or into another feature.
