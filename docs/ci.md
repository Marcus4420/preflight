# Running preflight in CI

`terraform-preflight --ci` needs three things in the runner: Node 20+, Terraform, and a
reachable Floci emulator. The recipes below run Floci as a service container next to the job,
point preflight at it with `PREFLIGHT_EXTERNAL_FLOCI`, and upload the report directory as a
build artifact so reviewers can download it and open `index.html` for the interactive graph.

Exit behavior: `--ci` exits `1` whenever the plan contains any add/change/destroy, and `0`
when the plan is clean. For infrastructure PRs a non-empty plan is usually the point, so
decide what the exit code should mean for you:

- **Drift gate** (plan must be empty, e.g. scheduled runs against main): let the job fail.
- **Review aid** (PRs where changes are expected): set `continue-on-error: true` (GitHub) or
  `allow_failure: true` (GitLab) and treat the report artifact as the deliverable.

## GitHub Actions

```yaml
name: preflight

on: pull_request

jobs:
  preflight:
    runs-on: ubuntu-latest

    services:
      floci:
        image: floci/floci:latest
        ports:
          - 4566:4566

    env:
      AWS_ENDPOINT_URL: http://localhost:4566
      AWS_ACCESS_KEY_ID: test
      AWS_SECRET_ACCESS_KEY: test
      AWS_DEFAULT_REGION: us-east-1
      PREFLIGHT_EXTERNAL_FLOCI: "true"
      PREFLIGHT_FLOCI_HEALTH_URL: http://localhost:4566/_floci/health

    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          # The wrapper injects extra output into terraform's stdout, which breaks
          # preflight's parsing of `terraform show -json`.
          terraform_wrapper: false

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Run preflight
        # Swap in your Terraform directory; drop continue-on-error to use it as a hard gate.
        working-directory: infra
        continue-on-error: true
        run: npx terraform-preflight --ci --out preflight-report

      - name: Upload report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: preflight-report
          path: infra/preflight-report/
```

## GitLab CI

GitLab exposes service containers by hostname (`floci` here) rather than localhost:

```yaml
preflight:
  image: node:22
  services:
    - name: floci/floci:latest
      alias: floci
  variables:
    AWS_ENDPOINT_URL: http://floci:4566
    AWS_ACCESS_KEY_ID: test
    AWS_SECRET_ACCESS_KEY: test
    AWS_DEFAULT_REGION: us-east-1
    PREFLIGHT_EXTERNAL_FLOCI: "true"
    PREFLIGHT_FLOCI_HEALTH_URL: http://floci:4566/_floci/health
  before_script:
    - apt-get update && apt-get install -y --no-install-recommends unzip
    - curl -fsSL -o /tmp/terraform.zip https://releases.hashicorp.com/terraform/1.15.8/terraform_1.15.8_linux_amd64.zip
    - unzip /tmp/terraform.zip -d /usr/local/bin
  script:
    - cd infra
    - npx terraform-preflight --ci --out preflight-report
  allow_failure: true # remove to use as a hard gate
  artifacts:
    when: always
    paths:
      - infra/preflight-report/
```

## Safety: pipelines that also hold real AWS credentials

If preflight runs in a pipeline that deploys for real (so real `AWS_ACCESS_KEY_ID` /
`AWS_SECRET_ACCESS_KEY` secrets exist), two layers keep the preflight step away from real AWS:

1. **Built-in guard**: before running terraform, preflight replaces any AWS credentials in the
   environment with dummy values and refuses to run at all if `AWS_ENDPOINT_URL` is not set.
   A misconfigured job fails loudly instead of silently planning against your real account.
2. **Scope your secrets anyway**: inject real credentials only into the job/step that applies
   (per-step `env` on GitHub, protected variables or separate jobs on GitLab), not as
   pipeline-wide variables. The preflight job needs no secrets at all.

## Notes

- The Terraform config must target the emulator - see "Pointing Terraform at Floci" in the
  main README. `AWS_ENDPOINT_URL` comes from the job environment, so the same config works
  locally and in CI unchanged.
- `preflight-report/plan.json` is a machine-readable summary (nodes, edges, add/change/destroy
  counts) if you want to script further checks, e.g. failing only on destroys.
- Everything runs against the local emulator; no real cloud credentials should ever be needed
  in these jobs.
