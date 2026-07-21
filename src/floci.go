package main

import (
	"context"
	"fmt"
	"log"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

const START_TIMEOUT_MS int = 60_000

func main() {
	providerConfig := getProviderConfig()
	checkFlociIsInstalled()
	isFlociRunning(providerConfig)
	startFloci(providerConfig)
	stopFloci(providerConfig)
}

func flociArgs(provider ProviderConfig, args ...string) []string {
	return append(append([]string{}, provider.FlociSubcommand...), args...)
}

func checkFlociIsInstalled() bool {
	cmd := exec.Command("floci", "--version")
	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
	fmt.Println("Floci is installed")
	return true
}

func isFlociRunning(provider ProviderConfig) bool {
	config := flociArgs(provider, "status")
	cmd := exec.Command("floci", config...)
	out, err := cmd.Output()
	if err != nil {
		return false
	}
	matched, _ := regexp.MatchString(`(?i)Reachable:\s*yes`, string(out))
	return matched
}

func startFloci(provider ProviderConfig) bool {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(START_TIMEOUT_MS)*time.Millisecond)
	defer cancel()

	if isFlociRunning(provider) {
		fmt.Println("Floci is already running")
		return true
	}
	config := flociArgs(provider, "start")
	fmt.Println("Starting Floci...")
	cmd := exec.CommandContext(ctx, "floci", config...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		log.Fatalf("Failed to start Floci: %v\nOutput: %s", err, string(out))
	}

	for {
		if isFlociRunning(provider) {
			return true
		}
		select {
		case <-ctx.Done():
			return false
		case <-time.After(500 * time.Millisecond):
		}
	}
}

func stopFloci(provider ProviderConfig) bool {
	if !isFlociRunning(provider) {
		fmt.Println("Floci is not running")
		return true
	}
	config := flociArgs(provider, "stop")
	fmt.Println("Stopping Floci...")
	cmd := exec.Command("floci", config...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		log.Fatalf("Failed to stop Floci: %v\nOutput: %s", err, string(out))
	}
	return true
}

// Add working dir to this as input eventually
func getProviderConfig() ProviderConfig {
	cwd, err := filepath.Abs("../examples/wordpress-fargate")
	check(err)
	result, found, err := detectProvider(cwd)
	check(err)
	// Consider if we should return an error if no provider is detected instead of defaulting to AWS
	if !found {
		fmt.Println("no provider detected, using default provider: AWS")
		return Providers[ProviderIdAWS]
	}
	return Providers[result]
}

func waitForFlociToBeReady(provider ProviderConfig) bool {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(START_TIMEOUT_MS)*time.Millisecond)
	defer cancel()
	for {
		if isFlociRunning(provider) {
			return true
		}
		select {
		case <-ctx.Done():
			return false
		case <-time.After(500 * time.Millisecond):
		}
	}
}

func getFlociEnv(provider ProviderConfig) map[string]string {
	exportLineRe := regexp.MustCompile(`^export\s+([A-Z0-9_]+)=(.*)$`)
	env := make(map[string]string)
	config := flociArgs(provider, "env")

	out, err := exec.Command("floci", config...).Output()
	check(err)

	for _, line := range strings.Split(string(out), "\n") {
		line = strings.TrimRight(line, "\r")
		match := exportLineRe.FindStringSubmatch(line)
		if match == nil {
			continue
		}
		value := strings.TrimSpace(match[2])
		value = strings.TrimPrefix(value, `"`)
		value = strings.TrimSuffix(value, `"`)
		env[match[1]] = value
	}

	return env
}
