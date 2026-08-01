#!/usr/bin/env bash
# Verify that every architecture decision record carries the required sections
# and a recognised status.
#
# Usage:  bash scripts/check-adrs.sh
# Exit:   0 = every ADR is complete, 1 = at least one is incomplete

set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
adr_dir="$repo_root/docs/adr"

if [ ! -d "$adr_dir" ]; then
    printf 'FAIL: %s does not exist\n' "$adr_dir"
    exit 1
fi

failures=0
count=0

for file in "$adr_dir"/[0-9]*.md; do
    [ -e "$file" ] || continue
    name="$(basename "$file")"
    count=$((count + 1))
    problems=""

    # Required headings. "Alternatives" is matched loosely so
    # "Alternatives considered" satisfies it.
    grep -qi '^\*\*Status:\*\*'      "$file" || problems="$problems status-field"
    grep -qi '^## *Context'          "$file" || problems="$problems context"
    grep -qi '^## *Decision'         "$file" || problems="$problems decision"
    grep -qi '^## *Alternatives'     "$file" || problems="$problems alternatives"
    grep -qi '^## *Consequences'     "$file" || problems="$problems consequences"

    # Status must be one of the recognised values.
    if grep -qi '^\*\*Status:\*\*' "$file"; then
        status_line="$(grep -i -m1 '^\*\*Status:\*\*' "$file")"
        case "$status_line" in
            *Accepted*|*Proposed*|*Superseded*|*Deprecated*|*Rejected*) ;;
            *) problems="$problems unrecognised-status" ;;
        esac
    fi

    # Every ADR must be referenced from the index.
    if [ -f "$adr_dir/README.md" ]; then
        grep -q "$name" "$adr_dir/README.md" || problems="$problems not-in-index"
    fi

    if [ -n "$problems" ]; then
        printf '%s: MISSING ->%s\n' "$name" "$problems"
        failures=$((failures + 1))
    else
        printf '%s: ok\n' "$name"
    fi
done

printf '\nchecked %s ADR(s)\n' "$count"

if [ "$count" -eq 0 ]; then
    printf 'FAIL: no ADRs found\n'
    exit 1
fi

if [ "$failures" -gt 0 ]; then
    printf 'FAIL: %s incomplete ADR(s)\n' "$failures"
    exit 1
fi

printf 'OK: every ADR is complete\n'
exit 0
