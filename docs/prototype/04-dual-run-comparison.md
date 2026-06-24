# Dual-run comparison

`MAPPING_ENGINE_MODE=both` runs every submission through **both** the legacy
mapper and the rules engine:

- the **legacy payload is transmitted** to the target API — production
  behaviour is unchanged
- both payloads are persisted as a **comparison record** so the rule-based
  mapping can be proven sound against real traffic before the legacy code is
  removed
- a rules-engine failure is recorded in the comparison record and logged, but
  **never blocks** the legacy transmission

## Comparison record

One record is stored per submission:

```jsonc
{
  "mappingId": "consent-to-cwt", // "unknown" when no mapping file matched
  "formId": "69a1a64c093ab56d4fa9f339",
  "referenceNumber": "576-225-943",
  "timestamp": "2026-06-10T12:00:00.000Z",
  "matches": true, // deep equality after JSON normalisation
  "legacyPayload": { … }, // what was transmitted
  "rulesPayload": { … }, // what the rules engine produced (null on failure)
  "rulesError": "…" // present only when the rules engine failed
}
```

`matches` compares the two payloads after a JSON round-trip, so an
`undefined`-valued key (legacy) and an omitted key (rules) compare equal —
both serialise identically in the transmitted JSON.

For the `file` and `none` backends a mismatch is also logged at `warn`
level (`Mapping comparison MISMATCH for submission <ref>`), so mismatches can be
monitored from logs without reading the store. The `log` backend omits this
warning because it already reports the mismatch (at `info`) itself.

## Storage backends

Selected with `COMPARISON_STORE` (config `mappingEngine.comparisonStore`):

| Backend         | Configuration                                        | Notes                                                                                                         |
| --------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `log` (default) | —                                                    | One `info` log line per submission, prefixed `[cstore]`. Never emits payloads — safe for any environment      |
| `file`          | `COMPARISON_STORE_DIR` (default `.comparison-store`) | One JSON document per submission at `<dir>/<formId>/<reference>-<timestamp>.json`. Good for local development |
| `none`          | —                                                    | Nothing is persisted; mismatches are still logged                                                             |

Storage failures are logged and swallowed deliberately: by the time the
comparison is stored the payload has already been transmitted, so throwing
would cause the SQS message to be retried and the submission to be sent to
the target API twice.

### `log` backend

The `log` backend records the comparison result to the application logs at
`info` level (even when a mismatch or rules-engine failure is found), so it is
suitable for deployed environments where a separate store is not wanted. Every
line is prefixed with `[cstore]` so the comparison output is easy to grep.

It never logs payload data:

- **Match** — a single line stating the comparison succeeded for the reference
  number; no payload information is recorded because there is nothing to fix.
- **Mismatch** — a line stating differences were found, plus a structured,
  **data-free** description of each differing property (its path and the shape
  of the difference: a missing key, a differing array/string length, a type
  change, etc.) — never the values themselves.
- **Rules-engine failure** — a line noting the comparison could not be made and
  the engine error message.

### Submitted data is never persisted from production

Submitted form data may contain personal data and must not be saved out of
production. The `file` backend therefore **strips the raw payloads**
(leaving the comparison metadata and a `payloadsOmitted: true` marker) unless
`NODE_ENV` is explicitly set to a non-production value. An unset `NODE_ENV` — or
one set to `production` / `prod` — is treated as production and omits the
payloads. The `log` backend never emits payloads in any environment.

## Reviewing comparisons

With the `file` backend, mismatches can be listed with:

```bash
grep -rl '"matches": false' .comparison-store/
```

Each mismatching record contains both full payloads, so a diff of the two
fields shows exactly which rule needs adjusting. The handful of intentional
differences are listed in [06-known-differences.md](06-known-differences.md).
