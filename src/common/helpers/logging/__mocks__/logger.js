import { vi } from 'vitest'

const logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
}

function createLogger() {
  return logger
}

export { createLogger }
