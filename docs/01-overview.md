# Overview

## What is this?

A Node.js service that listens for Defra Forms submissions on an AWS SQS queue, transforms each submission into a structured format based on the form type, and transmits the result to an external RESTful API.

The service currently handles three Natural England protected sites consultation forms:

- **Advice** - Requests for Natural England advice on proposed works near protected sites
- **Assent** - S28H assent applications for works under agri-environment agreements
- **Consent** - S28E consent applications for works by land owners/occupiers on SSSIs

## How it works

1. **Poll** - The service continuously polls an SQS queue for new submission messages
2. **Validate** - Each message is validated against the Defra Forms submission schema
3. **Route** - The submission is matched to a form mapper using the form ID from the message metadata
4. **Transform** - The form mapper extracts and restructures the submission data into a standardised output format
5. **Transmit** - The transformed data is sent as a JSON POST request to the downstream API
6. **Delete** - Successfully processed messages are deleted from the queue
7. **Retry** - Failed messages remain in the queue and are retried after the visibility timeout

## Key features

- **Form-specific mapping** - Each form type has a dedicated mapper that understands the form's field structure and transforms submissions into the correct output format
- **Sequential processing** - Messages are processed one at a time within each polling coroutine
- **Configurable concurrency** - Multiple polling coroutines can run in parallel for higher throughput
- **Automatic retry** - Failed messages remain in the queue and are retried based on SQS visibility timeout configuration
- **Schema validation** - All incoming messages are validated against the Defra Forms submission schema before processing
- **Health check endpoint** - Exposes `/health` for container orchestration and load balancer probes

## What's included

- SQS polling and message lifecycle management
- Schema validation using Joi
- Form-specific data transformation mappers
- HTTP transmission to a downstream API
- Structured logging (ECS format in production, pretty-printed in development)
- Health check endpoint
- Docker support
- TypeScript type definitions for input and output formats
