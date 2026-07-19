terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

variable "floci_endpoint" {
  description = "Base URL of the Floci GCP emulator."
  type        = string
  default     = "http://localhost:4588"
}

provider "google" {
  project      = "floci-local"
  region       = "us-central1"
  access_token = "floci-test-token"

  storage_custom_endpoint        = "${var.floci_endpoint}/storage/v1/"
  pubsub_custom_endpoint         = "${var.floci_endpoint}/v1/"
  secret_manager_custom_endpoint = "${var.floci_endpoint}/v1/"
  firestore_custom_endpoint      = "${var.floci_endpoint}/v1/"
}

# ---- Event ingestion pipeline: uploads land in a bucket, notifications fan out ----

resource "google_storage_bucket" "uploads" {
  name                        = "floci-local-uploads"
  location                    = "US"
  force_destroy               = true
  uniform_bucket_level_access = true
}

resource "google_storage_bucket" "processed" {
  name                        = "floci-local-processed"
  location                    = "US"
  force_destroy               = true
  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
}

resource "google_pubsub_topic" "uploads" {
  name = "upload-events"
}

resource "google_pubsub_topic" "dead_letter" {
  name = "upload-events-dead-letter"
}

resource "google_pubsub_subscription" "processor" {
  name  = "upload-processor"
  topic = google_pubsub_topic.uploads.id

  ack_deadline_seconds = 30

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }
}

resource "google_pubsub_subscription" "audit" {
  name  = "upload-audit"
  topic = google_pubsub_topic.uploads.id

  retain_acked_messages = true
  ack_deadline_seconds  = 10
}

resource "google_storage_notification" "uploads" {
  bucket         = google_storage_bucket.uploads.name
  topic          = google_pubsub_topic.uploads.id
  payload_format = "JSON_API_V1"
  event_types    = ["OBJECT_FINALIZE"]
}

resource "google_secret_manager_secret" "processor_config" {
  secret_id = "processor-config"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "processor_config" {
  secret      = google_secret_manager_secret.processor_config.id
  secret_data = jsonencode({ output_bucket = google_storage_bucket.processed.name })
}
