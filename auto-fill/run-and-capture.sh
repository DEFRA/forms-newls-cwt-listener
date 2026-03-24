#!/usr/bin/env bash
#
# Runs each Playwright test one at a time (serially), waits for the
# mock-api-receiver to write a received-*.json file, renames it to
# [form]---[test-title].json, then moves on to the next test.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECEIVED_DIR="$(cd "$SCRIPT_DIR/../mock-api-receiver/received" && pwd)"
OUTPUT_DIR="$RECEIVED_DIR/playwright"

# How long (seconds) to wait for a received file before giving up
POLL_TIMEOUT=120
POLL_INTERVAL=1

# Ordered list: form-name|test-title
TESTS=(
  # Advice form tests
  "advice|consultant-ga-fc-hra"
  "advice|consultant-ga-fc-s28i-woodland"
  "advice|consultant-ga-fc-something-else"
  "advice|gov-agency-ea-hra"
  "advice|gov-agency-ea-s28i"
  "advice|gov-agency-other-agency"
  "advice|harbour-authority-s28g-hra"
  "advice|landowner-general-question"
  "advice|member-of-public-damage-report"
  "advice|member-of-public-drone"
  "advice|other-category-other-org-general-question"
  "advice|lpa-s28g-pre-assent"
  # Assent form tests
  "assent|public-body-consultant-csht-single-sssi-no-eu"
  "assent|public-body-lpa-sfi-single-sssi-yes-eu"
  "assent|public-body-other-mta-multi-sssi-scheme"
  "assent|working-on-behalf-hls-single-sssi"
  "assent|public-body-landowner-no-scheme-multi-sssi-ornec"
  # Consent form tests
  "consent|owner-other-single-sssi"
  "consent|occupier-csht-single-sssi"
  "consent|permission-other-multi-sssi"
  "consent|somebody-else-hls-multi-sssi"
  "consent|owner-other-permission-single-sssi"
)

# Colours for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Colour

passed=0
failed=0
skipped=0

echo -e "${CYAN}=== Run & Capture: ${#TESTS[@]} tests ===${NC}"
echo -e "${CYAN}Output directory: ${OUTPUT_DIR}${NC}"
echo ""

# Ensure output subdirectories exist
mkdir -p "$OUTPUT_DIR/advice" "$OUTPUT_DIR/assent" "$OUTPUT_DIR/consent"

for entry in "${TESTS[@]}"; do
  form="${entry%%|*}"
  test_title="${entry##*|}"
  spec_file="tests/${form}.spec.ts"
  output_file="$OUTPUT_DIR/${form}/${form}---${test_title}.json"

  echo -e "${CYAN}[${form}] Running: ${test_title}${NC}"

  # Record the time just before running the test (epoch seconds)
  run_start=$(date +%s)

  # Run exactly one test by grep-matching its title
  if (cd "$SCRIPT_DIR" && npx playwright test "$spec_file" --grep "$test_title" --headed 2>&1); then
    echo -e "${GREEN}  ✓ Test passed${NC}"
  else
    echo -e "${RED}  ✗ Test failed${NC}"
    ((failed++))
    echo -e "${YELLOW}  Skipping capture for failed test${NC}"
    echo ""
    continue
  fi

  # Wait for a received-*.json file that was created at or after run_start
  echo -e "  Waiting for received file..."
  elapsed=0
  found_file=""

  while [ $elapsed -lt $POLL_TIMEOUT ]; do
    # Look for received-*.json files in the top-level received directory
    for candidate in "$RECEIVED_DIR"/received-*.json; do
      [ -f "$candidate" ] || continue
      # Get file modification time as epoch seconds
      file_mtime=$(stat -f "%m" "$candidate" 2>/dev/null || stat -c "%Y" "$candidate" 2>/dev/null)
      if [ "$file_mtime" -ge "$run_start" ]; then
        found_file="$candidate"
        break 2
      fi
    done

    sleep "$POLL_INTERVAL"
    ((elapsed += POLL_INTERVAL))
  done

  if [ -z "$found_file" ]; then
    echo -e "${RED}  ✗ Timed out waiting for received file (${POLL_TIMEOUT}s)${NC}"
    ((skipped++))
    echo ""
    continue
  fi

  # Rename the file
  mv "$found_file" "$output_file"
  echo -e "${GREEN}  → Saved: ${form}/${form}---${test_title}.json${NC}"
  ((passed++))
  echo ""
done

echo -e "${CYAN}=== Summary ===${NC}"
echo -e "  ${GREEN}Captured: ${passed}${NC}"
echo -e "  ${RED}Failed:   ${failed}${NC}"
echo -e "  ${YELLOW}Skipped:  ${skipped}${NC}"
echo -e "  Total:    ${#TESTS[@]}"
