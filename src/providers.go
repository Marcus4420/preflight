package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

type providerId string

const (
	ProviderIdAWS   providerId = "aws"
	ProviderIdAzure providerId = "azure"
	ProviderIdGCP   providerId = "gcp"
	ProviderIdLocal providerId = "local"
)

type ProviderConfig struct {
	Id                 providerId
	FlociSubcommand    []string
	DefaultHealthUrl   string
	TerraformProviders []string
	UseFlociEnv        bool
}

var Providers = map[providerId]ProviderConfig{
	ProviderIdAWS: {
		Id:                 ProviderIdAWS,
		FlociSubcommand:    []string{},
		DefaultHealthUrl:   "http://localhost:4566/_floci/health",
		TerraformProviders: []string{"aws"},
		UseFlociEnv:        true,
	},
	ProviderIdAzure: {
		Id:                 ProviderIdAzure,
		FlociSubcommand:    []string{"az"},
		DefaultHealthUrl:   "http://localhost:4577/_floci/health",
		TerraformProviders: []string{"azurerm", "azuread", "azapi"},
		UseFlociEnv:        false,
	},
	ProviderIdGCP: {
		Id:                 ProviderIdGCP,
		FlociSubcommand:    []string{"gcp"},
		DefaultHealthUrl:   "http://localhost:4588/",
		TerraformProviders: []string{"google", "google-beta"},
		UseFlociEnv:        false,
	},
}

func detectProvider(cwd string) (providerId, bool, error) {
	filePaths, err := filepath.Glob(filepath.Join(cwd, "*.tf"))
	fmt.Println("files found:", filePaths)
	providersDetected := make(map[providerId]bool)
	check(err)
	for _, file := range filePaths {
		data, err := os.ReadFile(file)
		check(err)
		re := regexp.MustCompile(`(?m)^\s*provider\s+"([\w-]+)"`)
		matches := re.FindAllSubmatch(data, -1)
		for _, match := range matches {
			id, ok := isProviderId(string(match[1]))
			if ok {
				providersDetected[id] = true
			}
		}
	}
	if len(providersDetected) > 1 {
		return "", false, fmt.Errorf("multiple providers detected: %v", providersDetected)
	}
	if len(providersDetected) == 1 {
		for id := range providersDetected {
			return id, true, nil
		}
	}
	return "", false, nil
}

func isProviderId(s string) (providerId, bool) {
	id := providerId(s)
	_, ok := Providers[id]
	return id, ok
}

func scrubCloudCredentials(base map[string]string) map[string]string {
	env := make(map[string]string, len(base))
	for k, v := range base {
		env[k] = v
	}

	// AWS
	delete(env, "AWS_PROFILE")
	delete(env, "AWS_SESSION_TOKEN")
	env["AWS_ACCESS_KEY_ID"] = "test"
	env["AWS_SECRET_ACCESS_KEY"] = "test"

	// Azure (azurerm reads ARM_*; service principals and CLI/managed identity paths)
	for key := range env {
		if strings.HasPrefix(key, "ARM_") {
			delete(env, key)
		}
	}
	delete(env, "AZURE_CLIENT_ID")
	delete(env, "AZURE_CLIENT_SECRET")
	delete(env, "AZURE_TENANT_ID")
	delete(env, "AZURE_FEDERATED_TOKEN_FILE")

	// GCP
	delete(env, "GOOGLE_APPLICATION_CREDENTIALS")
	delete(env, "GOOGLE_CREDENTIALS")
	delete(env, "GOOGLE_OAUTH_ACCESS_TOKEN")
	delete(env, "GOOGLE_IMPERSONATE_SERVICE_ACCOUNT")

	return env
}


