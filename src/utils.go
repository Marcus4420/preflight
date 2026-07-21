package main

import "strings"

func check(e error) {
	if e != nil {
		panic(e)
	}
}

func envToMap(environ []string) map[string]string {
	m := make(map[string]string, len(environ))
	for _, kv := range environ {
		if k, v, ok := strings.Cut(kv, "="); ok {
			m[k] = v
		}
	}
	return m
}
