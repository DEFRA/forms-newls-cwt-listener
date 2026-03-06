import { SQSClient } from '@aws-sdk/client-sqs'

import { config } from '../config.js'

/** @type {string} */
const awsRegion = config.get('awsRegion')
/** @type {string} */
const sqsEndpoint = config.get('sqsEndpoint')

/**
 * Gets the SQS Client
 * @returns {SQSClient}
 */
export function getSQSClient() {
  return new SQSClient({
    region: awsRegion,
    endpoint: sqsEndpoint
  })
}

export const sqsClient = getSQSClient()
