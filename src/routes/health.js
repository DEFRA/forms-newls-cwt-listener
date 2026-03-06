/**
 * Health endpoint for CDP container
 */
/** @type {import('@hapi/hapi').ServerRoute} */
const health = {
  method: 'GET',
  path: '/health',
  handler: (_request, h) => h.response({ message: 'success' })
}

export { health }
