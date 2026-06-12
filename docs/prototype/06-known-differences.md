# Known differences from the legacy mappers

The parity tests (`src/service/rule-mapping/mapping-parity.test.js`) prove the
mapping files reproduce the legacy output for representative submissions on
every form path. A small number of edge-case behaviours differ by design;
they are listed here so that dual-run mismatches can be triaged quickly.

## 1. `email_header` overflow in extreme-length cases

The three legacy mappers each implement slightly different bespoke truncation
when the 255-character budget is exceeded. The engine's `joinSegments`
implements one generic algorithm (greedy: fixed segments first, `fitNames`
segments fitted into the remaining space, final `...` truncation). Results
are identical while the joined content fits in 255 characters — the normal
case — and may differ when it does not:

- **advice**: when the activity text plus site names overflow, legacy
  truncates the _activity_ to guarantee room for the first site name; the
  engine instead fits the names into whatever space remains and truncates the
  end of the whole header as a last resort.
- **assent**: when SSSI names and European site names are both long, legacy
  reserves space for the first European site name before fitting SSSI names;
  the engine allocates space strictly left to right.
- **consent**: when the primary segment alone exceeds 255 characters _and_
  site names are present, legacy hard-truncates without an ellipsis; the
  engine truncates with `...`.

## 2. Error messages

Both systems throw on the same bad data (unparsable SSSI ids, missing
`---` separators in European site values, unexpected consent customer types),
but the engine wraps errors with the mapping and rule id, e.g.
`Mapping "consent-to-cwt" rule "consulting-body-type.from-customer-type" failed: …`.

## 3. Grouped consent entries with no SSSI name

In the consent multi-SSSI path, legacy groups repeater entries missing the
SSSI name under the literal key `"Unknown"` and then throws when parsing it as
an id. The engine omits the unparsable `SSSI_id` from that item instead. The
form requires the SSSI name, so this cannot occur with real submissions.

## 4. Site-name fallback ordering on empty repeater entries

Where the legacy code selects a site-name source by checking whether a
repeater has _entries_, the mapping files select it by checking whether the
repeater has _answers_ (`firstAnswered` over `collect` expressions). The two
differ only when a repeater entry exists with the relevant answer missing,
which the form validation prevents.
