# Phase 4 — Presentation Formats

> Status: **Pending**
> Blocker: None. Can ship independently.

---

## Goal

Reduce dependency on Slides.com by letting speakers upload their own files (.pptx, .pdf) or embed any URL. Both formats render inside the existing presentation viewer without changing the presenter/audience experience.

---

## Features in this phase

| Feature | Status |
|---|---|
| PowerPoint and PDF presentation support | Pending |
| iFrame URL embedding (experimental) | Pending |

---

## 4.1 PowerPoint / PDF Upload
Files: `app/dashboard/talk/[id]/edit/page.tsx`, `components/talk/UploadPresentationDialog.tsx`, `app/api/presentation/upload/route.ts`, `components/viewer/SlideRenderer.tsx`

### Upload flow
1. Speaker opens talk editor → "Upload presentation" button
2. File picker accepts `.pptx` and `.pdf` only (validated client + server)
3. File uploaded to **Vercel Blob** via `/api/presentation/upload`
4. Server-side conversion:
   - `.pdf` → extract pages as images using a PDF library (e.g. `pdf2pic` or `pdfjs-dist`)
   - `.pptx` → convert to PDF first (via LibreOffice headless or `officegen`), then extract pages
   - Resulting slide images stored in Blob as `presentation/{talk_id}/slide-{n}.webp`
5. Talk record updated with `presentation_type: 'upload'`, `slide_count`, `blob_prefix`

### Viewer rendering
- `SlideRenderer` fetches slide images from Blob by index: `{blob_prefix}/slide-{currentSlide}.webp`
- Preloads adjacent slides (current ± 1) for smooth transitions
- Same next/prev controls as existing Slides.com viewer
- Existing realtime sync (slide index broadcast) works unchanged

### Limits
- Max file size: 50MB (enforced client + server)
- Max slides: 200 (enforced during conversion)
- Conversion is async — show a "Processing..." state while conversion runs

### Data model addition
```sql
-- Add to talks table
presentation_type  text default 'slidescom',  -- 'slidescom' | 'upload' | 'iframe'
blob_prefix        text,   -- set for 'upload' type
slide_count        int,    -- set for 'upload' type
iframe_url         text,   -- set for 'iframe' type
```

---

## 4.2 iFrame URL Embedding (Experimental)
Files: `components/talk/IframeUrlInput.tsx`, `components/viewer/IframeRenderer.tsx`

### Setup flow
1. Speaker opens talk editor → "Embed URL" option (alongside Upload)
2. Text input for the URL
3. Live preview in an iframe within the editor
4. Disclaimer shown prominently:
   > "iFrame embedding is experimental. Compatibility depends on the source website. Many sites block embedding by default. Use at your own risk."
5. Talk record updated with `presentation_type: 'iframe'`, `iframe_url`

### Viewer rendering
- `IframeRenderer` renders `<iframe src={iframe_url} />` fullscreen within the presentation area
- Slide sync controls are hidden (no slide index concept for iFrames)
- A "This presentation is embedded from an external source" notice shown to audience

### Security
- URL validated: must be `https://` only
- CSP headers on the viewer page must allow the iframe origin
- No `allow-scripts` or `allow-same-origin` in sandbox unless explicitly needed

---

## Definition of Done

- [ ] Speaker can upload `.pptx` or `.pdf` from the talk editor
- [ ] File is stored in Blob, converted to slide images server-side
- [ ] Slide images render correctly in the viewer with next/prev controls
- [ ] Realtime slide sync works with uploaded presentations
- [ ] Processing state shown during conversion
- [ ] Speaker can input a URL and see a live preview
- [ ] Iframe disclaimer shown in editor and viewer
- [ ] Presentation type persisted correctly in `talks` table
- [ ] `features.json` feat-013, feat-014 marked complete
