declare module '@defra/hapi-tracing' {
  export const tracing: {
    plugin: import('@hapi/hapi').Plugin<{ tracingHeader: string }>
  }

  export function getTraceId(): string | undefined
}

declare module '@defra/hapi-secure-context' {
  export const secureContext: import('@hapi/hapi').ServerRegisterPluginObject<void>
}

declare module 'convict-format-with-validator' {
  const formats: Record<string, unknown>
  export default formats
}
