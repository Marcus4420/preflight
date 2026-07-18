terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  s3_use_path_style           = true
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  # Endpoint comes from the AWS_ENDPOINT_URL environment variable (set by `floci env`
  # natively, or directly in docker-compose.yml for the container path) rather than a
  # hardcoded endpoints block, so this same config works in both modes.
}

# Sensors drop raw readings here.
resource "aws_s3_bucket" "uploads" {
  bucket = "sensor-telemetry-uploads"
}

# Every upload becomes a message for the processor to pick up.
resource "aws_sqs_queue" "processing" {
  name                       = "telemetry-processing"
  visibility_timeout_seconds = 60
}

resource "aws_sqs_queue_policy" "processing" {
  queue_url = aws_sqs_queue.processing.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "s3.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.processing.arn
      Condition = {
        ArnEquals = { "aws:SourceArn" = aws_s3_bucket.uploads.arn }
      }
    }]
  })
}

resource "aws_s3_bucket_notification" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  queue {
    queue_arn = aws_sqs_queue.processing.arn
    events    = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_sqs_queue_policy.processing]
}

# Per-object processing state, keyed by S3 object key.
resource "aws_dynamodb_table" "processing_state" {
  name         = "telemetry-processing-state"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "object_key"

  attribute {
    name = "object_key"
    type = "S"
  }
}

resource "aws_cloudwatch_log_group" "processor" {
  name              = "/pipeline/telemetry-processor"
  retention_in_days = 14
}

resource "aws_iam_role" "processor" {
  name = "telemetry-processor"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "processor" {
  name = "telemetry-processor-permissions"
  role = aws_iam_role.processor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = aws_sqs_queue.processing.arn
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem"]
        Resource = aws_dynamodb_table.processing_state.arn
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.processor.arn}:*"
      }
    ]
  })
}
