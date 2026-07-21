package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
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
