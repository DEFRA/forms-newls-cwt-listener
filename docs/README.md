# Forms Transmit Listener Documentation

A service that listens for Defra Forms submissions on an AWS SQS queue, transforms the data into a structured format, and transmits it to an external API.

This service currently handles three Natural England protected sites consultation form types: Advice, Assent, and Consent.

## Quick links

1. [**Overview**](01-overview.md) - How the system works
2. [**Architecture**](02-architecture.md) - System diagrams and data flow
3. [**Payload structure**](03-payload-structure.md) - Input and output data formats
4. [**Form mappers**](04-form-mappers.md) - How each form type is transformed

## What it does

- Polls an SQS queue for form submission messages
- Validates each message against the submission schema
- Selects the mapping file for the submission based on its form ID
- Transforms submission data into a structured output format
- Sends the transformed data to an external RESTful API, retrying transient failures with back-off
- Deletes successfully processed messages from the queue

A submission normally becomes one API call. A mapping may declare an `expand` block that fans it out into several — the Consent form sends one submission per land owner or occupier named on a notice. See [payload expansion](mapping-system/02-mapping-file-format.md#payload-expansion).

## Configuration

The service requires the following environment variables:

| Variable                                | Description                                | Default    |
| --------------------------------------- | ------------------------------------------ | ---------- |
| `EVENTS_SQS_QUEUE_URL`                  | SQS queue URL to poll                      | -          |
| `UNIVERSITY_API_URL`                    | Downstream API endpoint                    | -          |
| `UNIVERSITY_API_RETRY_MAX_ATTEMPTS`     | Attempts per API call, including the first | `3`        |
| `UNIVERSITY_API_RETRY_INITIAL_DELAY_MS` | Back-off before the second attempt         | `500`      |
| `UNIVERSITY_API_RETRY_MAX_DELAY_MS`     | Ceiling on the back-off                    | `10000`    |
| `MAPPINGS_DIR`                          | Directory of `*.mapping.json` files        | `mappings` |
| `RECEIVE_MESSAGE_TIMEOUT_MS`            | Polling interval (ms)                      | `30000`    |
| `SQS_MAX_NUMBER_OF_MESSAGES`            | Max messages per poll                      | `10`       |
| `SQS_VISIBILITY_TIMEOUT`                | Visibility timeout (seconds)               | `30`       |
| `CONCURRENT_COROUTINES`                 | Number of parallel polling tasks           | `1`        |
| `LOG_LEVEL`                             | Logging level                              | `info`     |

## Running locally

```bash
npm install
npm run dev
```

## Need help?

- Review [payload structure](03-payload-structure.md) for input and output data formats
- See [architecture](02-architecture.md) for system design
- See [form mappers](04-form-mappers.md) for transformation logic
- Read the main [README](../README.md) for setup details
