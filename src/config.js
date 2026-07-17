import 'dotenv/config'

import convict from 'convict'
import convictFormatWithValidator from 'convict-format-with-validator'

import { knownHandlerNames } from './service/transmitters/handlers/index.js'

convict.addFormats(convictFormatWithValidator)

const isProduction = process.env.NODE_ENV === 'production'
const isDev = process.env.NODE_ENV !== 'production'
const isTest = process.env.NODE_ENV === 'test'

const DEFAULT_MESSAGE_TIMEOUT = 30

const DEFAULT_RETRY_MAX_ATTEMPTS = 3
const DEFAULT_RETRY_INITIAL_DELAY_MS = 500
const DEFAULT_RETRY_MAX_DELAY_MS = 10000

/**
 * Builds the config block for a destination that mapping files may name in
 * their "destination". Each destination brings its own address, credential and
 * handler, and can override the shared back-off defaults through its own
 * environment variables.
 * @param {{ envPrefix: string, handler: string }} options - The destination's
 *   environment variable prefix, and the handler that encodes its requests
 * @returns {convict.Schema<unknown>}
 */
function destination({ envPrefix, handler }) {
  return {
    url: {
      doc: 'URL to send mapped payloads to',
      format: String,
      default: null,
      env: `${envPrefix}_URL`
    },
    apiKey: {
      doc: 'API key for the destination - ensure it has a trailing slash',
      format: String,
      nullable: true,
      default: null,
      env: `${envPrefix}_KEY`
    },
    healthCheckUrl: {
      doc: 'Health check URL for the destination',
      format: String,
      nullable: true,
      default: null,
      env: `${envPrefix}_HEALTH_CHECK_URL`
    },
    handler: {
      doc: 'Encodes and authenticates requests to this destination. Which handler an API needs is a property of that API, so this is deliberately not settable by environment',
      format: knownHandlerNames(),
      default: handler
    },

    /**
     * Back-off retry for individual sends. Absorbs transient errors before they
     * reach the queue-level retry, which is costly once a submission fans out
     * into several payloads.
     */
    retry: {
      maxAttempts: {
        doc: 'Attempts per send, including the first. 1 disables retrying',
        format: 'int',
        default: DEFAULT_RETRY_MAX_ATTEMPTS,
        env: `${envPrefix}_RETRY_MAX_ATTEMPTS`
      },
      initialDelayMs: {
        doc: 'Delay before the second attempt, doubling each attempt thereafter',
        format: 'int',
        default: DEFAULT_RETRY_INITIAL_DELAY_MS,
        env: `${envPrefix}_RETRY_INITIAL_DELAY_MS`
      },
      maxDelayMs: {
        doc: 'Ceiling for any single back-off delay',
        format: 'int',
        default: DEFAULT_RETRY_MAX_DELAY_MS,
        env: `${envPrefix}_RETRY_MAX_DELAY_MS`
      }
    }
  }
}

const config = convict({
  serviceVersion: {
    doc: 'The service version, this variable is injected into your docker container in CDP environments',
    format: String,
    nullable: true,
    default: null,
    env: 'SERVICE_VERSION'
  },
  host: {
    doc: 'The IP address to bind',
    format: 'ipaddress',
    default: '0.0.0.0',
    env: 'HOST'
  },
  port: {
    doc: 'The port to bind',
    format: 'port',
    default: 3007,
    env: 'PORT'
  },
  serviceName: {
    doc: 'Api Service Name',
    format: String,
    default: 'forms-adaptor-template'
  },
  isProduction: {
    doc: 'If this application running in the production environment',
    format: Boolean,
    default: isProduction
  },
  isDevelopment: {
    doc: 'If this application running in the development environment',
    format: Boolean,
    default: isDev
  },
  isTest: {
    doc: 'If this application running in the test environment',
    format: Boolean,
    default: isTest
  },
  cdpEnvironment: {
    doc: 'The CDP environment the app is running in. With the addition of "local" for local development',
    format: [
      'local',
      'infra-dev',
      'management',
      'dev',
      'test',
      'perf-test',
      'ext-test',
      'prod'
    ],
    default: 'local',
    env: 'ENVIRONMENT'
  },
  log: {
    isEnabled: {
      doc: 'Is logging enabled',
      format: Boolean,
      default: !isTest,
      env: 'LOG_ENABLED'
    },
    level: {
      doc: 'Logging level',
      format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: 'info',
      env: 'LOG_LEVEL'
    },
    format: {
      doc: 'Format to output logs in',
      format: ['ecs', 'pino-pretty'],
      default: isProduction ? 'ecs' : 'pino-pretty',
      env: 'LOG_FORMAT'
    },
    redact: {
      doc: 'Log paths to redact',
      format: Array,
      default: isProduction
        ? ['req.headers.authorization', 'req.headers.cookie', 'res.headers']
        : ['req', 'res', 'responseTime']
    }
  },
  isMetricsEnabled: {
    doc: 'Enable metrics reporting',
    format: Boolean,
    default: isProduction,
    env: 'ENABLE_METRICS'
  },
  tracing: {
    header: {
      doc: 'CDP tracing header name',
      format: String,
      default: 'x-cdp-request-id',
      env: 'TRACING_HEADER'
    }
  },

  /**
   * API integrations
   */
  designerUrl: {
    doc: 'URL to call Forms Designer',
    format: String,
    default: null,
    env: 'DESIGNER_URL'
  },
  managerUrl: {
    doc: 'URL to call Forms Manager API',
    format: String,
    default: null,
    env: 'MANAGER_URL'
  },
  /**
   * Destinations a mapping file can send to, keyed by the name it uses in its
   * "destination". Every destination named by a mapping file must appear here;
   * this is checked against the mapping files on startup.
   */
  destinations: {
    universityApi: destination({
      envPrefix: 'UNIVERSITY_API',
      handler: 'jsonFormData'
    })
  },

  /**
   * Rule-based mapping engine
   */
  mappingEngine: {
    mappingsDir: {
      doc: 'Directory containing the *.mapping.json mapping files',
      format: String,
      default: 'mappings',
      env: 'MAPPINGS_DIR'
    }
  },

  /**
   * SQS Messaging
   */
  awsRegion: {
    doc: 'AWS region',
    format: String,
    default: 'eu-west-2',
    env: 'AWS_REGION'
  },
  sqsEndpoint: {
    doc: 'The SQS endpoint, if required (e.g. a local development dev service)',
    format: String,
    default: '',
    env: 'SQS_ENDPOINT'
  },
  sqsEventsQueueUrl: {
    doc: 'SQS queue URL',
    format: String,
    default: '',
    env: 'EVENTS_SQS_QUEUE_URL'
  },
  receiveMessageTimeout: {
    doc: 'The wait time between each poll in milliseconds',
    format: Number,
    default: DEFAULT_MESSAGE_TIMEOUT * 1000,
    env: 'RECEIVE_MESSAGE_TIMEOUT_MS'
  },
  maxNumberOfMessages: {
    doc: 'The maximum number of messages to be received from queue at a time',
    format: Number,
    default: 10,
    env: 'SQS_MAX_NUMBER_OF_MESSAGES'
  },
  visibilityTimeout: {
    doc: 'The number of seconds that a message is hidden from other consumers after being retrieved from the queue.',
    format: Number,
    default: 30,
    env: 'SQS_VISIBILITY_TIMEOUT'
  },
  numberOfConcurrentPollingCoroutines: {
    doc: 'The number of concurrent polling coroutines - to enable higher throughput',
    format: Number,
    default: 1,
    env: 'CONCURRENT_COROUTINES'
  }
})

if (!isTest) {
  config.validate({ allowed: 'strict' })
}

export { config }
