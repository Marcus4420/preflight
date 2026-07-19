terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

variable "floci_endpoint_host" {
  description = "Hostname (no scheme) of the Floci Azure emulator. Requires floci-az running with FLOCI_AZ_TLS_ENABLED=true and its certificate trusted (see docs/ci.md)."
  type        = string
  default     = "localhost:4577"
}

provider "azurerm" {
  features {}

  # Everything below points the provider at the local emulator instead of real Azure.
  environment     = "stack"
  metadata_host   = var.floci_endpoint_host
  use_cli         = false
  subscription_id = "00000000-0000-0000-0000-000000000001"
  tenant_id       = "00000000-0000-0000-0000-000000000002"
  client_id       = "00000000-0000-0000-0000-000000000003"
  client_secret   = "fake-secret"

  resource_provider_registrations = "none"
}

# ---- A small app stack: networking, storage, registry, cache, database, secrets ----

resource "azurerm_resource_group" "main" {
  name     = "app-stack"
  location = "westeurope"
}

resource "azurerm_virtual_network" "main" {
  name                = "app-stack-vnet"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  address_space       = ["10.30.0.0/16"]
}

resource "azurerm_subnet" "apps" {
  name                 = "apps"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.30.1.0/24"]
}

resource "azurerm_subnet" "data" {
  name                 = "data"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.30.2.0/24"]
}

resource "azurerm_network_security_group" "apps" {
  name                = "apps-nsg"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  security_rule {
    name                       = "allow-https"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "apps" {
  subnet_id                 = azurerm_subnet.apps.id
  network_security_group_id = azurerm_network_security_group.apps.id
}

resource "azurerm_storage_account" "assets" {
  name                     = "flociappstackassets"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "uploads" {
  name                  = "uploads"
  storage_account_id    = azurerm_storage_account.assets.id
  container_access_type = "private"
}

resource "azurerm_container_registry" "main" {
  name                = "flociappstackacr"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
}

resource "azurerm_redis_cache" "main" {
  name                = "app-stack-cache"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  capacity            = 0
  family              = "C"
  sku_name            = "Basic"
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "app-stack-db"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "16"
  sku_name               = "B_Standard_B1ms"
  storage_mb             = 32768
  administrator_login    = "appadmin"
  administrator_password = "local-dev-only-1!"
}

resource "azurerm_postgresql_flexible_server_database" "app" {
  name      = "app"
  server_id = azurerm_postgresql_flexible_server.main.id
}

resource "azurerm_key_vault" "main" {
  name                = "app-stack-kv"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tenant_id           = "00000000-0000-0000-0000-000000000002"
  sku_name            = "standard"
}

resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = azurerm_postgresql_flexible_server.main.administrator_password
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "redis_connection" {
  name         = "redis-connection"
  value        = azurerm_redis_cache.main.primary_connection_string
  key_vault_id = azurerm_key_vault.main.id
}
