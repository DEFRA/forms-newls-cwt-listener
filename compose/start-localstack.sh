#!/bin/bash
export AWS_REGION=eu-west-2
export AWS_DEFAULT_REGION=eu-west-2
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

# topics
aws --endpoint-url=http://localhost:4566 sns create-topic --name forms_runner_submission_events

# queues
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name forms_adaptor_events
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name forms_adaptor_events-deadletter

# subscriptions
aws --endpoint-url=http://localhost:4566 sns subscribe --topic-arn "arn:aws:sns:eu-west-2:000000000000:forms_runner_submission_events" \
  --protocol sqs --attributes RawMessageDelivery=true --notification-endpoint "arn:aws:sqs:eu-west-2:000000000000:forms_adaptor_events"
