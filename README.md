# Ruiqi Shu Homepage

Academic homepage for Ruiqi Shu, built with Vite, React, and TypeScript. The design uses a full-width de Chirico cover, a warm paper background with Clay accents, a sticky profile column, locally bundled Source Serif 4 and DM Sans fonts, and larger reading typography. Mobile layouts use a single column; light and dark appearances are available.

## Development

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open **http://127.0.0.1:5173/**. The preview updates automatically when source files change.

## Content and layout

- `src/data/profile.ts`: personal details, publication records, news, experience, presentations, awards, and service.
- `src/data/blog.ts`: bilingual article content, references, formulas, and slides.
- `src/data/blogIndex.ts`: lightweight blog metadata used on the homepage. Keep its title, date, slug, and description aligned with `blog.ts` when adding or editing articles.
- `src/components/`: profile sidebar, homepage, publication filters, and the separately loaded bilingual blog.
- `src/styles.css`: typography, colors, responsive layouts, print styling, and focus states.
- `public/images/` and `public/files/`: original photographs, publication figures, and English/Chinese CV PDFs.

Chinese text uses the system's Kai typeface (`Kaiti SC`, `STKaiti`, or `KaiTi`). The CVs embed the Kai font so that their appearance is preserved when opened on another computer.

## Final appearance

The chosen homepage is **Inside the Painting (05)** with the **Clay** palette. The production page opens directly on Giorgio de Chirico's *Gare Montparnasse (The Melancholy of Departure)*, followed by the academic content. The design and palette preview controls have been removed. Old `art` and `palette` query parameters are ignored and removed from the URL, so old links also open the final design. Light/dark appearance remains available and is remembered.

The cover uses the full painting near its original aspect ratio on ordinary desktop screens. Wider screens crop mainly the lower foreground, keeping the clock tower, far figures, and architectural perspective. Phone screens focus on the right-hand vista, with a separate bottom shade for legible text. The original JPEG remains unchanged. Styles are in `src/art-designs.css`; artwork metadata and attribution are in `src/data/artDesigns.ts`.

Image and catalogue source: [MoMA: Gare Montparnasse](https://www.moma.org/collection/works/80538). The museum attribution, date, and listed rights credit remain in the page caption/footer. The earlier five-design previews are local design history and are not part of the published site.

The website and bilingual CVs share the Clay colors, Source Serif 4, DM Sans, and bold Kai Chinese text.

## CVs

Edit `cv/ruiqi_shu_cv.tex` and `cv/ruiqi_shu_cv_zh.tex`, then run `npm run build:cv` from the project root. This requires XeLaTeX and the locally installed `Kaiti SC` font. The script compiles each document twice to resolve page numbers and links, then updates both `cv/` and the homepage's `public/files/` downloads.

The CV design shares the homepage's warm paper color, Source Serif 4, DM Sans, brown links, and date column. The print fonts in `cv/fonts/` come from the same Fontsource packages as the website; their SIL Open Font License files are included. Both CVs retain all twelve publication records and use complete records on each page.

Publications default to four selected papers; visitors can view all twelve and filter by year. Existing section anchors and blog article URLs are preserved.

## Build

```bash
npm run build
npm run lint
```

The production build is written to `dist/`. To inspect it locally, run `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` and open http://127.0.0.1:4173/.

## Deployment

Deploy the generated static site to the GitHub Pages user repository:
`ChiyodaMomo01/ChiyodaMomo01.github.io`.

Do not commit files under `task/`; that directory contains planning material and may include credentials.
