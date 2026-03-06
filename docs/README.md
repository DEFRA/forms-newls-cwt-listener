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
- Routes the submission to the correct form mapper based on form ID
- Transforms submission data into a structured output format
- Sends the transformed data to an external RESTful API
- Deletes successfully processed messages from the queue

## Configuration

The service requires the following environment variables:

| Variable                     | Description                      | Default                    |
| ---------------------------- | -------------------------------- | -------------------------- |
| `EVENTS_SQS_QUEUE_URL`       | SQS queue URL to poll            | -                          |
| `UNIVERSITY_API_URL`         | Downstream API endpoint          | -                          |
| `ADVICE_FORM_ID`             | Form ID for advice submissions   | `69a07d92093ab56d4fa9f325` |
| `ASSENT_FORM_ID`             | Form ID for assent submissions   | `69a1a593093ab56d4fa9f330` |
| `CONSENT_FORM_ID`            | Form ID for consent submissions  | `69a1a64c093ab56d4fa9f339` |
| `RECEIVE_MESSAGE_TIMEOUT_MS` | Polling interval (ms)            | `30000`                    |
| `SQS_MAX_NUMBER_OF_MESSAGES` | Max messages per poll            | `10`                       |
| `SQS_VISIBILITY_TIMEOUT`     | Visibility timeout (seconds)     | `30`                       |
| `CONCURRENT_COROUTINES`      | Number of parallel polling tasks | `1`                        |
| `LOG_LEVEL`                  | Logging level                    | `info`                     |

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
