# preflight

See what a Terraform change would actually do before it touches real infrastructure.

`preflight` starts [Floci](https://floci.io)'s local AWS emulator, runs a real `terraform plan`
against it, and opens an interactive graph of what would be created, changed, or destroyed —
click any resource to see its before/after diff. No real AWS credentials, no real cloud calls.

## Quick start (Docker Compose)

Only requirement: Docker.

```
git clone https://github.com/Marcus4420/preflight.git
cd preflight
docker compose up --build
```

Then open http://localhost:4700. By default this runs against the bundled
`examples/telemetry-pipeline` example — edit the `volumes:` mount in `docker-compose.yml` to
point at your own Terraform directory instead. `docker compose down` tears everything down.

Note: `terraform init` inside the container writes `.terraform/` into the mounted directory as
the container's user (root by default). Harmless for just running preflight, but can cause
permission friction if you later run `terraform` natively in that same directory on Linux.

## Alternative: run natively

Needs Terraform, Docker, and the Floci CLI all installed locally:

- [Terraform](https://developer.hashicorp.com/terraform/install)
- [Docker](https://docs.docker.com/get-docker/) (Floci runs in a container either way)
- [Floci](https://floci.io) — `irm https://floci.io/install.ps1 | iex` (Windows) or see their site for macOS/Linux

From a directory containing Terraform config targeting Floci's emulated AWS endpoint:

```
npx terraform-preflight
```

This starts Floci (if it isn't already running), runs `terraform plan`, and opens a browser
tab with the visualization. Floci is stopped again on exit, unless it was already running
before `preflight` started it.

```
cd examples/telemetry-pipeline
node ../../dist/cli.js
```

## Pointing Terraform at Floci

Your AWS provider needs `skip_credentials_validation` etc. set, and an endpoint override. The
endpoint comes from the `AWS_ENDPOINT_URL` environment variable — set automatically by `floci
env` natively, or directly in `docker-compose.yml` for the container path — rather than a
hardcoded `endpoints {}` block, so the same config works in both modes:

```hcl
provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  s3_use_path_style           = true
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
}
```

## Development

```
npm install
npm run build
node dist/cli.js
```

`src/` is the CLI (Node + TypeScript): starts/stops Floci, runs and parses `terraform plan`,
serves the visualization. `web/` is the frontend (Vite + React + TypeScript + `@xyflow/react`).

## License

MIT
