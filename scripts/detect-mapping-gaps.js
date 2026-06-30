/**
 * Mapping gap detection CLI.
 *
 * Cross-checks a mapping file against the form definition it maps and the
 * output schema it must produce. See docs/mapping-system/04-gap-detection.md.
 *
 * Usage:
 *   node scripts/detect-mapping-gaps.js --mapping <mapping-file> --form <form-definition> [--strict]
 *
 * Examples:
 *   npm run mapping:gaps -- --mapping mappings/advice-cwt.mapping.json --form form-definitions/advice.json
 *
 * The output schema is resolved from the mapping file's "outputSchema"
 * property (relative to the mapping file). Exits non-zero when errors are
 * found; with --strict, warnings also cause a non-zero exit.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { analyseMappingGaps } from '../src/service/rule-mapping/gap-analysis.js'
import { loadMappingFile } from '../src/service/rule-mapping/registry.js'

const { values: args } = parseArgs({
  options: {
    mapping: { type: 'string' },
    form: { type: 'string' },
    strict: { type: 'boolean', default: false }
  }
})

if (!args.mapping || !args.form) {
  console.error(
    'Usage: node scripts/detect-mapping-gaps.js --mapping <mapping-file> --form <form-definition> [--strict]'
  )
  process.exit(2)
}

const mappingPath = resolve(args.mapping)
const mapping = loadMappingFile(mappingPath)
const formDefinition = JSON.parse(readFileSync(resolve(args.form), 'utf8'))
const outputSchemaPath = resolve(dirname(mappingPath), mapping.outputSchema)
const outputSchema = JSON.parse(readFileSync(outputSchemaPath, 'utf8'))

const findings = analyseMappingGaps({ mapping, formDefinition, outputSchema })

const errors = findings.filter((finding) => finding.severity === 'error')
const warnings = findings.filter((finding) => finding.severity === 'warning')

console.log(`Mapping:       ${mappingPath}`)
console.log(`Form:          ${resolve(args.form)} (${formDefinition.name})`)
console.log(`Output schema: ${outputSchemaPath}`)
console.log('')

if (findings.length === 0) {
  console.log('No mapping gaps detected.')
} else {
  for (const finding of findings) {
    const label = finding.severity === 'error' ? 'ERROR  ' : 'WARNING'
    console.log(`${label} [${finding.code}] ${finding.message}`)
  }
  console.log('')
  console.log(`${errors.length} error(s), ${warnings.length} warning(s).`)
}

if (errors.length > 0 || (args.strict && warnings.length > 0)) {
  process.exit(1)
}
