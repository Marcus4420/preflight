# preflight

See what a Terraform change would actually do before it touches real infrastructure.

`preflight` starts [Floci](https://floci.io)'s local AWS emulator, runs a real `terraform plan`
against it, and opens an interactive graph of what would be created, changed, or destroyed —
click any resource to see its before/after diff. No real AWS credentials, no real cloud calls.

## Requirements

- [Terraform](https://developer.hashicorp.com/terraform/install)
- [Docker](https://docs.docker.com/get-docker/) (Floci runs in a container)
- [Floci](https://floci.io) — `irm https://floci.io/install.ps1 | iex` (Windows) or see their site for macOS/Linux

## Usage

From a directory containing Terraform config targeting Floci's emulated AWS endpoint:

```
npx terraform-preflight
```

This starts Floci (if it isn't already running), runs `terraform plan`, and opens a browser
tab with the visualization. Floci is stopped again on exit, unless it was already running
before `preflight` started it.

Your Terraform AWS provider needs to point at Floci, e.g.:

```hcl
provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  s3_use_path_style           = true
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    s3       = "http://localhost:4566"
    dynamodb = "http://localhost:4566"
    # add endpoints per service used
  }
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
