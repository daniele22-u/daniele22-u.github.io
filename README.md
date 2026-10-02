# daniele22-u.github.io

Personal portfolio of **Daniele Uras**, biomedical engineer (EEG, signal processing, machine learning).

**Live:** https://daniele22-u.github.io

## Stack

Plain HTML, CSS and JavaScript: no framework, no build step. GitHub Pages serves the files as they are (`.nojekyll` turns Jekyll off).

```
index.html            page content (English)
404.html              custom "signal lost" page for broken links (self-contained)
privacy.html          privacy notice (EN/IT)
robots.txt, sitemap.xml   search-engine basics
i18n.js               Italian translations + EN/IT switch
style.css             layout, themes (dark default, light toggle), responsive rules
main.js               animations: EEG hero, ASCII electrode montage, project waveforms
assets/
  og.png              1200×630 link-preview card (LinkedIn, WhatsApp, …)
  fonts/              self-hosted woff2 fonts + SIL OFL licences (no Google Fonts)
  js/count.js         GoatCounter script, served locally
  favicon.svg
  Daniele_Uras_CV.pdf
```

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

A local server is recommended so that fonts and paths behave exactly as on GitHub Pages.

## Editing

- **Text:** edit `index.html` for English and the matching key in `i18n.js` for Italian. Elements with `data-i18n="key"` are translated.
- **Projects:** each card in the *Work* section is an `<article class="ch" data-wave="…">`. `data-wave` picks the animation in `main.js` (`gnn`, `icu`, `sea`, `nda`, `sleep`, `eeg`, `mri`, `cop`).
- **Cache:** after changing `style.css`, `main.js` or `i18n.js`, bump the `?v=` number on their tags in `index.html`, otherwise browsers may mix the new page with old cached files.
- **CV:** replace `assets/Daniele_Uras_CV.pdf`, keeping the same name.
- **Language:** `?lang=it` or `?lang=en` in the URL forces a language. Otherwise the site follows the last choice, then the browser language.
