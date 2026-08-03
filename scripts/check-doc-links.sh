#!/usr/bin/env bash
# Verify that every relative Markdown link in the repository resolves to a file
# that exists. External (http/https/mailto) links and pure anchors are skipped.
#
# Usage:  bash scripts/check-doc-links.sh
# Exit:   0 = all links resolve, 1 = at least one broken link

set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root" || exit 1

broken=0
checked=0

# Every tracked Markdown file, excluding dependency directories.
while IFS= read -r file; do
    dir="$(dirname "$file")"

    # Extract the target of each [text](target) link, one per line.
    grep -o '\[[^][]*\]([^()]*)' "$file" 2>/dev/null \
    | sed 's/.*](\(.*\))/\1/' \
    | while IFS= read -r target; do
        # Skip external links, mail links and in-page anchors.
        case "$target" in
            http://*|https://*|mailto:*|'#'*|'') continue ;;
        esac

        # Strip any #anchor and any "title" suffix.
        path="${target%%#*}"
        path="${path%% *}"
        [ -z "$path" ] && continue

        # Resolve relative to the containing file.
        resolved="$dir/$path"

        if [ ! -e "$resolved" ]; then
            printf '%s: broken link -> %s\n' "$file" "$target"
            printf 'BROKEN\n' >> "$repo_root/.linkcheck.tmp"
        fi
    done

    checked=$((checked + 1))
done < <(find . -name '*.md' \
    -not -path '*/node_modules/*' \
    -not -path '*/dist/*' \
    -not -path '*/bin/*' \
    -not -path '*/obj/*' \
    -not -path './.git/*' | sort)

if [ -f "$repo_root/.linkcheck.tmp" ]; then
    broken="$(wc -l < "$repo_root/.linkcheck.tmp" | tr -d ' ')"
    rm -f "$repo_root/.linkcheck.tmp"
fi

printf '\nchecked %s Markdown files\n' "$checked"

if [ "$broken" -gt 0 ]; then
    printf 'FAIL: %s broken relative link(s)\n' "$broken"
    exit 1
fi

printf 'OK: all relative links resolve\n'
exit 0
