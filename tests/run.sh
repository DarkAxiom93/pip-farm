#!/usr/bin/env bash
# Builds the test page (web build + a small hook), runs the browser tests,
# and checks each test printed the lines listed in tests/expect.txt.
set -e
cd "$(dirname "$0")/.."
node scripts/build-game.mjs --test
cd tests
fail=0
for t in branch_test branch_test2 ngplus_test outside_test soak; do
  echo "== $t"
  out=$(python3 "$t.py" 2>&1) || { echo "$out" | tail -20; echo "FAIL: $t crashed"; fail=1; continue; }
  echo "$out" | grep -av '^\s'
  while IFS='|' read -r name want; do
    [ "$name" = "$t" ] || continue
    if ! grep -aqF -- "$want" <<<"$out"; then echo "FAIL: $t did not print: $want"; fail=1; fi
  done < expect.txt
done
[ $fail = 0 ] && echo "ALL TESTS PASSED" || { echo "SOME TESTS FAILED"; exit 1; }
