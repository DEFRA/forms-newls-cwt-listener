# forms-adaptor-template

Forms Adaptor Listener Template

- [Requirements](#requirements)
  - [Node.js](#nodejs)
- [Local development](#local-development)
  - [Setup](#setup)
  - [Harness for local development](#harness-for-local-development)
  - [Creating your adaptor](#creating-your-adaptor)
    - [Writing your service method](#writing-your-service-method)
    - [Form Definition](#1-form-definition)
    - [Formatter](#2-formatter)
    - [Output](#3-output)
    - [Optimisation](#optimisation)
  - [Notes on SQS queue configuration](#notes-on-sqs-queue-configuration)
  - [Development](#development)
  - [Testing](#testing)
  - [Production](#production)
  - [Npm scripts](#npm-scripts)
  - [Update dependencies](#update-dependencies)
  - [Formatting](#formatting)
    - [Windows prettier issue](#windows-prettier-issue)
- [API endpoints](#api-endpoints)
- [Development helpers](#development-helpers)
  - [Proxy](#proxy)
- [Docker](#docker)
  - [Development image](#development-image)
  - [Production image](#production-image)
  - [Docker Compose](#docker-compose)
  - [Dependabot](#dependabot)
  - [SonarCloud](#sonarcloud)
- [Licence](#licence)
  - [About the licence](#about-the-licence)

## Requirements

### Node.js

Please install [Node.js](http://nodejs.org/) `>= v22` and [npm](https://nodejs.org/) `>= v11`. You will find it
easier to use the Node Version Manager [nvm](https://github.com/creationix/nvm)

To use the correct version of Node.js for this application, via nvm:

```bash
cd forms-adaptor-template
nvm use
```

## Local development

### Setup

Create a `.env` file (this will be ignored in `.gitignore`) and put the following variables inside:

```
FORMS_AUDIT_QUEUE='forms_adaptor_events'
LOG_LEVEL=debug
SQS_ENDPOINT=http://localhost:4566
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=dummy
EVENTS_SQS_QUEUE_URL=http://sqs.eu-west-2.127.0.0.1:4566/000000000000/forms_adaptor_events
AWS_SECRET_ACCESS_KEY=dummy
RECEIVE_MESSAGE_TIMEOUT_MS=5000
MANAGER_URL=http://localhost:3001
DESIGNER_URL=http://localhost:3000
```

Install application dependencies:

```bash
npm install
```

### Harness for local development

A harness exists in `https://github.com/DEFRA/forms-development-tools` which allows the required dependencies
to be setup for the adaptor. `forms-manager` is used by the `example-logger` to fetch the appropriate version
of the form - this is needed to build up question titles and appropriately map the event fields to text fields.
For some teams this may not be required.

### Creating your adaptor

The adaptor template has all the scaffolding for consuming and processing of the form submission events.

In order to handle the events you will need to inject your service into `handleFormSubmissionEvents` in `src/service/index.js`.
The service must satisfy the interface:

```ts
export interface FormAdapterSubmissionService {
  handleFormSubmission: (
    submissionMessage: FormAdapterSubmissionMessage
  ) => unknown
}
```

An example service exists in `src/service/example-logger.js`, which maps the form fields and user answers and them logs them to stdout.
As well as a basic logger, library methods exist for sending govuk notify mails.

For local testing a number of simple fixtures exist in `test/fixtures` that can be reused:

- `simple-event.json` is the body of the SQS message - this can be tested with any sqs tool, such as `awslocal`
- `simple-event-definition.json` is the definition for this form which can be saved to `forms-manager` `forms-manager->form-definition` MongoDB collection
- `simple-event-meta.json` is the corresponding metadata for `forms-manager->form-metadata` MongoDB collection
- `simple-event-version.json` is the corresponding version document for `forms-manager->form-versions` MongoDB collection

#### Writing your service method

The `FormAdapterSubmissionService` `handleFormSubmission` service method generally consists of:

1. an API call to get the version of the form definition that was submitted
2. a formatter to aggregate the submission data (state) and the definition to your desired structure
3. an output

##### 1. Form Definition

`src/service/example-logger.js` contains a call to the manager versions endpoint `/forms/${formId}/versions/${versionNumber}/definition`.
This will get the version of the definition of the form that was submitted, which is a prerequisite for a properly aggregated dataset.

##### 2. Formatter

`src/service/mappers/formatters` contains two possible formatters that can be used, the machine v2 formatter will return the same output
as the current machine readable v2 email, but in JSON (rather than Base64 encoded) format.
The example formatter gives another output format which may be useful for your team.
This is used in the `example-logger`.

##### 3. Output

`src/service/example-logger.js` outputs the aggregated data to `stdout` (using `pino`).
This will need to be replaced with a more valuable output - which is likely to be either an api call or a notify email.
`src/lib` contains the fetch client which can be used to create an API client to your service.
`src/lib/manager.js` is an example of an implementation that can be used as a basis for this.
Alternatively, if you need to send a formatted email to notify, you can use the `src/lib/notify.js`.
NB - you will need to add a `NOTIFY_API_KEY` env variable, uncomment `notifyAPIKey` in `src/config.js` and line 6 of `src/lib/notify.js`.

If your listener service requires a database, please use [cdp-node-backend-template](https://github.com/DEFRA/cdp-node-backend-template)
from which this template has been forked. Routing already exists should it need a REST API.

#### Optimisation

A number of different optimisation parameters exist, see [Notes on SQS queue configuration](#notes-on-sqs-queue-configuration)
for SQS configuration options.
Additionally `CONCURRENT_COROUTINES` allows you to increase the number of concurrent polling asynchronous coroutines.
This is especially helpful if you have a busy queue, as SQS allows for a maximum of 10 messages to be handled at a time.
Should you be performing heavily CPU intensive blocking operations then it would be advisable to make sure of node.js worker threads.
More information is available on [CDP Documentation](https://portal.cdp-int.defra.cloud/documentation/how-to/long-process.md#node-js-worker-thread)
This is not required for polling as node.js can handle multiple asynchronous network operations very well -
you could theoretically have 1,000s of concurrent polling processes, although this is untested, your team is responsible for performance testing.

Polling has been used for collection of messages due to restrictions on the use of lambdas within the platform.

### Notes on SQS queue configuration

`ReceiveMessageWaitTime` - this is probably the most important queue setting and controls what amazon call long polling vs short polling. When `ReceiveMessageWaitTime` is greater than 0, long polling is in effect. The max `ReceiveMessageWaitTime` is 20s.

This is the code affect by this setting:

```js
export function receiveEventMessages() {
  const command = new ReceiveMessageCommand(input)
  return sqsClient.send(command)
}
```

With short-polling, line 3 fetches any messages from SQS and yields immediately.
It may sample only a subset of the queue’s partitions, so you might not see all currently available messages on that call.

With long-polling, if there aren’t any messages found, the HTTP connection is kept open for up to 20s until some arrive. The consumer of receiveEventMessages is left waiting while that happens.
It will fetch all currently available messages up to the message limit across the queue's partitions.

By default, CDP set `ReceiveMessageWaitTime` to 20s. The auditing queue also uses this default.

See [here](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-short-and-long-polling.html) for more information.

#### Queue configuration in forms-audit-api

`RECEIVE_MESSAGE_TIMEOUT_MS` - the amount of time to wait between calls to receive messages

`SQS_MAX_NUMBER_OF_MESSAGES` - the number of messages to receive at once (max 10)

`SQS_VISIBILITY_TIMEOUT` - when receiving a message from an Amazon SQS queue, it remains in the queue but becomes temporarily invisible to other consumers. This invisibility is controlled by the visibility timeout, which ensures that other consumers cannot process the same message while you are working on it.

### Development

To run the application in `development` mode run:

```bash
npm run dev
```

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

### Npm scripts

All available Npm scripts can be seen in [package.json](./package.json).
To view them in your command line run:

```bash
npm run
```

### Update dependencies

To update dependencies use [npm-check-updates](https://github.com/raineorshine/npm-check-updates):

> The following script is a good start. Check out all the options on
> the [npm-check-updates](https://github.com/raineorshine/npm-check-updates)

```bash
ncu --interactive --format group
```

### Formatting

#### Windows prettier issue

If you are having issues with formatting of line breaks on Windows update your global git config by running:

```bash
git config --global core.autocrlf false
```

## API endpoints

| Endpoint       | Description |
| :------------- | :---------- |
| `GET: /health` | Health      |

## Development helpers

### Proxy

We are using forward-proxy which is set up by default. To make use of this: `import { fetch } from 'undici'` then
because of the `setGlobalDispatcher(new ProxyAgent(proxyUrl))` calls will use the ProxyAgent Dispatcher

If you are not using Wreck, Axios or Undici or a similar http that uses `Request`. Then you may have to provide the
proxy dispatcher:

To add the dispatcher to your own client:

```javascript
import { ProxyAgent } from 'undici'

return await fetch(url, {
  dispatcher: new ProxyAgent({
    uri: proxyUrl,
    keepAliveTimeout: 10,
    keepAliveMaxTimeout: 10
  })
})
```

## Docker

### Development image

Build:

```bash
docker build --target development --no-cache --tag forms-adaptor-template:development .
```

Run:

```bash
docker run -e PORT=3007 -p 3007:3007 forms-adaptor-template:development
```

### Production image

Build:

```bash
docker build --no-cache --tag forms-adaptor-template .
```

Run:

```bash
docker run -e PORT=3007 -p 3007:3007 forms-adaptor-template
```

### Docker Compose

A local environment with:

- Localstack for AWS services (S3, SQS)
- Redis
- This service.
- A commented out frontend example.

```bash
docker compose up --build -d
```

### Dependabot

We have added an example dependabot configuration file to the repository. You can enable it by renaming
the [.github/example.dependabot.yml](.github/example.dependabot.yml) to `.github/dependabot.yml`

### SonarCloud

Instructions for setting up SonarCloud can be found in [sonar-project.properties](./sonar-project.properties)

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
