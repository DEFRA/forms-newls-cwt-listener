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
3. **Route** - The submission is matched to a mapping file using the form ID from the message metadata
4. **Transform** - The rule-based engine applies the mapping file's rules to restructure the submission data into a standardised output format
5. **Expand** - If the mapping declares an `expand` block, the result is fanned out into one payload per entry of a repeater; otherwise there is a single payload
6. **Transmit** - Each payload is sent as a JSON POST request to the downstream API, retrying transient errors with back-off
7. **Delete** - Successfully processed messages are deleted from the queue
8. **Retry** - Failed messages remain in the queue and are retried after the visibility timeout

## Key features

- **Declarative mapping** - Each form type has a JSON mapping file that describes how its fields are transformed into the correct output format; the engine is form-agnostic
- **Payload expansion** - A mapping can declare that one submission fans out into several API submissions, one per repeater entry — the NEWLS Consent form uses this to send CWT one submission per land owner or occupier named on a notice
- **Sequential processing** - Messages are processed one at a time within each polling coroutine
- **Configurable concurrency** - Multiple polling coroutines can run in parallel for higher throughput
- **Automatic retry** - Individual API calls retry transient errors with exponential back-off; failed messages then remain in the queue and are retried based on SQS visibility timeout configuration
- **Schema validation** - All incoming messages are validated against the Defra Forms submission schema before processing
- **Health check endpoint** - Exposes `/health` for container orchestration and load balancer probes

## What's included

- SQS polling and message lifecycle management
- Schema validation using Joi
- Rule-based data transformation driven by JSON mapping files
- HTTP transmission to a downstream API
- Structured logging (ECS format in production, pretty-printed in development)
- Health check endpoint
- Docker support
- TypeScript type definitions for input and output formats
