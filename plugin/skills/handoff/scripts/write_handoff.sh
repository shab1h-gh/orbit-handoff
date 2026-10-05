#!/bin/sh
# Replace HANDOFF-STATE.md (repo root by default) with stdin after validation.
set -eu

target="${1:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)/HANDOFF-STATE.md}"
tmp="$(mktemp "$(dirname "$target")/.handoff.XXXXXX")"
trap 'rm -f "$tmp"' EXIT HUP INT TERM

cat > "$tmp"

if [ ! -s "$tmp" ]; then
  echo "handoff rejected: content is empty" >&2
  exit 1
fi

# awk also counts a final line without a trailing newline.
lines="$(awk 'END { print NR }' "$tmp")"
if [ "$lines" -gt 50 ]; then
  echo "handoff rejected: $lines lines; maximum is 50" >&2
  exit 1
fi

# Backstop for obvious secrets. Report line numbers only, never the matched text.
secret_re='-----BEGIN [A-Z ]*PRIVATE KEY-----|AKIA[0-9A-Z]{16}|(sk|rk)_(live|test)_[0-9A-Za-z]{10,}|whsec_[0-9A-Za-z]{10,}|gh[pousr]_[0-9A-Za-z]{20,}|github_pat_[0-9A-Za-z_]{20,}|xox[abprs]-[0-9A-Za-z-]{10,}|eyJ[0-9A-Za-z_-]{10,}\.[0-9A-Za-z_-]{10,}\.|(secret|token|passw(or)?d|api[_-]?key)[a-z_]*["'\'']?[[:space:]]*[:=][[:space:]]*["'\'']?[^[:space:]"'\''`]{12,}'
hits="$(grep -Ein -e "$secret_re" "$tmp" | cut -d: -f1 | tr '\n' ' ' || true)"
if [ -n "$hits" ]; then
  echo "handoff rejected: possible secret on line(s) ${hits% }" >&2
  exit 1
fi

mv "$tmp" "$target"
trap - EXIT HUP INT TERM
printf 'wrote %s (%s lines)\n' "$target" "$lines"
