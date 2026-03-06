# forms-transmit-listener

Listens for Defra Forms submission events from an SQS queue, transforms them into the required format, and forwards them to the University of Southampton CWT (Casework Tracker) API.

The service handles three form types:

- **Advice** — SSSI/HRA advice requests (S28I, Standalone HRA, general topics)
- **Assent** — S28H assent applications from public bodies
- **Consent** — S28E consent applications from landowners/occupiers

Each form submission is mapped from the Defra Forms data model into a CWT-specific JSON payload and transmitted via HTTP POST.

- [Requirements](#requirements)
  - [Node.js](#nodejs)
- [Local development](#local-development)
  - [Setup](#setup)
  - [Development](#development)
  - [Testing](#testing)
  - [Production](#production)
- [Configuration](#configuration)
  - [Environment variables](#environment-variables)
  - [SQS queue configuration](#sqs-queue-configuration)
- [Architecture](#architecture)
- [API endpoints](#api-endpoints)
- [Docker](#docker)
  - [Development image](#development-image)
  - [Production image](#production-image)
  - [Docker Compose](#docker-compose)
- [Licence](#licence)

## Requirements

### Node.js

Please install [Node.js](http://nodejs.org/) `>= v22` and [npm](https://nodejs.org/) `>= v11`. You will find it
easier to use the Node Version Manager [nvm](https://github.com/creationix/nvm)

To use the correct version of Node.js for this application, via nvm:

```bash
cd forms-transmit-listener
nvm use
```

## Local development

### Setup

Create a `.env` file (this will be ignored in `.gitignore`) and put the following variables inside:

```
LOG_LEVEL=debug
SQS_ENDPOINT=http://localhost:4566
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
EVENTS_SQS_QUEUE_URL=http://sqs.eu-west-2.127.0.0.1:4566/000000000000/forms_adaptor_events
RECEIVE_MESSAGE_TIMEOUT_MS=5000
MANAGER_URL=http://localhost:3001
DESIGNER_URL=http://localhost:3000
UNIVERSITY_API_URL=http://localhost:3008/api
UNIVERSITY_API_KEY=your-api-key
```

Install application dependencies:

```bash
npm install
```

### Development

To run the application in `development` mode run:

```bash
npm run dev
```

This starts both the listener service and a mock API receiver for local testing.

### Testing

To test the application run:

```bash
npm run test
```

### Production

To mimic the application running in `production` mode locally run:

```bash
npm start
```

## Configuration

### Environment variables

| Variable                     | Description                                   | Default                    |
| :--------------------------- | :-------------------------------------------- | :------------------------- |
| `UNIVERSITY_API_URL`         | URL of the CWT API endpoint                   | —                          |
| `UNIVERSITY_API_KEY`         | API key for authenticating with the CWT API   | —                          |
| `ADVICE_FORM_ID`             | Form ID for the advice form                   | `69a07d92093ab56d4fa9f325` |
| `ASSENT_FORM_ID`             | Form ID for the assent form                   | `69a1a593093ab56d4fa9f330` |
| `CONSENT_FORM_ID`            | Form ID for the consent form                  | `69a1a64c093ab56d4fa9f339` |
| `EVENTS_SQS_QUEUE_URL`       | SQS queue URL for form submission events      | —                          |
| `SQS_ENDPOINT`               | SQS endpoint override (for local development) | —                          |
| `AWS_REGION`                 | AWS region                                    | `eu-west-2`                |
| `RECEIVE_MESSAGE_TIMEOUT_MS` | Wait time between polls in milliseconds       | `30000`                    |
| `SQS_MAX_NUMBER_OF_MESSAGES` | Max messages to receive at once (max 10)      | `10`                       |
| `SQS_VISIBILITY_TIMEOUT`     | Seconds a message is hidden after retrieval   | `30`                       |
| `CONCURRENT_COROUTINES`      | Number of concurrent polling coroutines       | `1`                        |

### SQS queue configuration

`ReceiveMessageWaitTime` controls long polling vs short polling. When greater than 0, long polling is in effect (max 20s). With long polling, if no messages are found the connection is held open until messages arrive or the timeout elapses. CDP sets `ReceiveMessageWaitTime` to 20s by default.

See the [AWS documentation](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-short-and-long-polling.html) for more information.

## Architecture

```
SQS Queue
  -> src/tasks/receive-messages.js     (polls for messages)
  -> src/service/events.js             (parses submission events)
  -> src/service/submission-handler.js  (routes by form ID)
  -> src/service/mappers/*-mapper.js   (transforms to CWT format)
  -> src/service/transmitters/         (POSTs to University API)
```

## API endpoints

| Endpoint       | Description  |
| :------------- | :----------- |
| `GET: /health` | Health check |

## Docker

### Development image

Build:

```bash
docker build --target development --no-cache --tag forms-transmit-listener:development .
```

Run:

```bash
docker run -e PORT=3007 -p 3007:3007 forms-transmit-listener:development
```

### Production image

Build:

```bash
docker build --no-cache --tag forms-transmit-listener .
```

Run:

```bash
docker run -e PORT=3007 -p 3007:3007 forms-transmit-listener
```

### Docker Compose

A local environment with:

- Localstack for AWS services (S3, SQS)
- Redis
- This service

```bash
docker compose up --build -d
```

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government licence v3
