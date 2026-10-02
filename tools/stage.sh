#!/usr/bin/env bash
# Copia il sito in una cartella di staging (anteprima privata).
#   tools/stage.sh <cartella-sorgente> <cartella-destinazione>
# Esempio (dalla radice del repo, su main): tools/stage.sh /percorso/branch-di-lavoro staging
#
# La copia: non è indicizzata (meta noindex + robots.txt), non conta visite
# (GoatCounter rimosso), non ha URL canonici e mostra una banda "STAGING".
set -euo pipefail
SRC="${1:?sorgente mancante}"
DST="${2:?destinazione mancante}"

rm -rf "$DST"
mkdir -p "$DST"
for f in index.html privacy.html style.css main.js i18n.js; do cp "$SRC/$f" "$DST/"; done
cp -r "$SRC/assets" "$DST/"
[ -d "$SRC/projects" ] && cp -r "$SRC/projects" "$DST/"

BANNER='<div style="position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#ff3b30;color:#fff;font:700 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.2em;text-align:center;padding:7px 0;pointer-events:none">STAGING · PREVIEW — NOT THE LIVE SITE</div>'

find "$DST" -name '*.html' -print0 | while IFS= read -r -d '' f; do
  python3 - "$f" "$BANNER" <<'PY'
import re, sys
path, banner = sys.argv[1], sys.argv[2]
s = open(path, encoding="utf-8").read()
s = re.sub(r'\s*<link rel="canonical"[^>]*>', '', s)
s = re.sub(r'\s*<!--[^>]*GoatCounter[^>]*-->', '', s)
s = re.sub(r'\s*<script data-goatcounter=[^>]*></script>', '', s)
s = s.replace('<head>', '<head>\n  <meta name="robots" content="noindex, nofollow">', 1)
s = s.replace('</body>', banner + '\n</body>', 1)
open(path, "w", encoding="utf-8").write(s)
PY
done
echo "staging pronto in $DST/"
