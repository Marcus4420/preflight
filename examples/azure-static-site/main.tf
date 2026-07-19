terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

variable "floci_endpoint_host" {
  description = "Hostname (no scheme) of the Floci Azure emulator's ARM metadata endpoint."
  type        = string
  default     = "localhost:4577"
}

provider "azurerm" {
  features {}

  # Everything below points the provider at the local emulator instead of real Azure.
  metadata_host   = var.floci_endpoint_host
  subscription_id = "00000000-0000-0000-0000-000000000000"
  tenant_id       = "00000000-0000-0000-0000-000000000000"
  client_id       = "floci-test"
  client_secret   = "floci-test"

  resource_provider_registrations = "none"
}

# ---- Static site: storage-hosted content behind a CDN, secrets in Key Vault ----

resource "azurerm_resource_group" "main" {
  name     = "static-site"
  location = "westeurope"
}

resource "azurerm_storage_account" "site" {
  name                     = "flocistaticsite"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  static_website {
    index_document     = "index.html"
    error_404_document = "404.html"
  }
}

resource "azurerm_storage_container" "assets" {
  name                  = "assets"
  storage_account_id    = azurerm_storage_account.site.id
  container_access_type = "blob"
}

resource "azurerm_storage_blob" "index" {
  name                   = "index.html"
  storage_account_name   = azurerm_storage_account.site.name
  storage_container_name = "$web"
  type                   = "Block"
  content_type           = "text/html"
  source_content         = "<h1>It works</h1>"
}

resource "azurerm_key_vault" "main" {
  name                = "floci-static-site-kv"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tenant_id           = "00000000-0000-0000-0000-000000000000"
  sku_name            = "standard"
}

resource "azurerm_key_vault_secret" "deploy_token" {
  name         = "deploy-token"
  value        = "local-dev-only"
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_cdn_profile" "main" {
  name                = "static-site-cdn"
  resource_group_name = azurerm_resource_group.main.name
  location            = "global"
  sku                 = "Standard_Microsoft"
}

resource "azurerm_cdn_endpoint" "site" {
  name                = "static-site"
  profile_name        = azurerm_cdn_profile.main.name
  resource_group_name = azurerm_resource_group.main.name
  location            = "global"

  origin {
    name      = "storage"
    host_name = azurerm_storage_account.site.primary_web_host
  }
}
