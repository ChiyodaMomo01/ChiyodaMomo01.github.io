#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
cv_build_dir="tmp/pdfs/cv-build"
mkdir -p "$cv_build_dir"
for cv_stem in ruiqi_shu_cv ruiqi_shu_cv_zh; do
  for cv_pass in 1 2; do
    xelatex -interaction=nonstopmode -halt-on-error -output-directory="$cv_build_dir" "cv/$cv_stem.tex" > "$cv_build_dir/$cv_stem-build.txt"
  done
  cp "$cv_build_dir/$cv_stem.pdf" "cv/$cv_stem.pdf"
  cp "$cv_build_dir/$cv_stem.pdf" "public/files/$cv_stem.pdf"
done
