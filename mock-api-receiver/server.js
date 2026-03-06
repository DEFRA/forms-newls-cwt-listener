/**
 * Mock API receiver for local development.
 *
 * Stands in for the real downstream API so that transmitted form submissions
 * can be inspected locally. Every POST payload is written as a timestamped
 * JSON file under `./received/` for easy diffing and debugging.
 *
 * Usage:
 *   node mock-api-receiver/server.js
 *
 * Then point the transmitter's target URL at http://localhost:3013
 */

import { createServer } from 'node:http'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = 3013
const __dirname = dirname(fileURLToPath(import.meta.url))
const receivedDir = join(__dirname, 'received')

/**
 * Formats a Date as `YYYY-MM-DD--HH-mm-ss` for use in filenames.
 * Uses double-dash to separate date from time so the filename stays
 * filesystem-safe (no colons) while remaining human-readable.
 * @param {Date} date
 * @returns {string}
 */
function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0')
  const yyyy = date.getFullYear()
  const MM = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const HH = pad(date.getHours())
  const mm = pad(date.getMinutes())
  const ss = pad(date.getSeconds())
  return `${yyyy}-${MM}-${dd}--${HH}-${mm}-${ss}`
}

/**
 * Collects the full request body from an incoming HTTP request stream.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<string>} The raw request body as a string.
 */
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

/**
 * Request handler. Only accepts POST requests — everything else gets a 404.
 * On success the parsed JSON payload is pretty-printed to a timestamped file
 * and a 200 response is returned containing the output filename.
 */
const server = createServer(async (req, res) => {
  if (req.method === 'POST') {
    try {
      const raw = await readBody(req)
      const contentType = req.headers['content-type'] || ''

      let body
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams(raw)
        const jsonFormData = params.get('json_form_data')
        if (!jsonFormData) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              status: 'error',
              message: 'Missing json_form_data field'
            })
          )
          return
        }
        body = JSON.parse(jsonFormData)
      } else {
        body = JSON.parse(raw)
      }

      await mkdir(receivedDir, { recursive: true })

      const filename = `received-${formatDateTime(new Date())}.json`
      const filepath = join(receivedDir, filename)

      await writeFile(filepath, JSON.stringify(body, null, 2), 'utf8')

      console.log(`Saved payload to ${filename}`)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', file: filename }))
    } catch (err) {
      console.error('Error processing request:', err.message)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'error', message: err.message }))
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'error', message: 'Not found' }))
  }
})

server.listen(PORT, () => {
  console.log(`Mock API receiver listening on http://localhost:${PORT}`)
  console.log(`Payloads will be saved to: ${receivedDir}`)
})
