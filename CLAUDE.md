# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Symbol SDK for TypeScript with OpenAPI Generator typescript-axios. It generates a TypeScript client library for the Symbol blockchain REST API using OpenAPI specifications.

Unlike the sister `typescript-fetch` package (which has no runtime dependencies), **axios is a runtime
(`dependencies`) dependency here**. Its code — and its transitive tree (`follow-redirects`, `form-data`,
`proxy-from-env`, …) — is bundled into the published package and inherited by every consumer. Supply-chain
hardening therefore has an extra job: keep a *known-CVE-free axios* out of the public artifact, not just out
of CI. See "Security: axios floor & monitoring" below.

## Architecture

### Code Generation Pipeline
1. **Published OpenAPI spec** - `fetch-openapi.js` downloads the official `openapi3.yml` from a pinned
   `symbol/symbol-openapi` GitHub release and verifies its SHA-256, writing it to `openapi-spec/openapi3.yml`
   (git-ignored). This replaced the former `symbol-openapi` submodule build, removing its vulnerable dev tooling.
2. **OpenAPI Generator** - Uses the typescript-axios generator (no custom templates; `openapi-generator-config.yml`
   sets `useSingleRequestParameter: true`).
3. **Generated API code** (`src/api/`) - Auto-generated, DO NOT edit manually.
4. **Build outputs** (`dist/`) - Contains CJS, ESM, and CDN bundles. The CDN bundle is self-contained: webpack
   bundles axios into `index.min.js`.

### Key Components
- **API Routes** (`src/api/api.ts`) - Generated `*RoutesApi` client classes for each endpoint group.
- **Runtime base** (`src/api/base.ts`, `common.ts`, `configuration.ts`) - `BaseAPI`, `Configuration`, the
  request builder, and `RequiredError`. The barrel (`src/api/index.ts`) re-exports `./api` + `./configuration`
  (the low-level `base.ts` internals are intentionally not re-exported).
- **Test Suites** (`tests/`) - Separate npm projects for Node.js JavaScript, TypeScript, and browser CDN.

## Development Commands

### Build Commands
```bash
# Generate API client code (run in root directory)
npm ci
npm run openapi:fetch         # Download + SHA-256 verify the published openapi3.yml
npm run openapi:set:version   # Set OpenAPI generator version to 6.0.0
npm run openapi:generate      # Generate TypeScript code from the fetched OpenAPI spec
npm run build                 # Build CJS, ESM, and CDN bundles
```

To bump the OpenAPI spec version, edit `SPEC_VERSION` / `SPEC_SHA256` in `fetch-openapi.js`
(see the comment in that file for how to obtain the new checksum). Java is required for the
OpenAPI Generator itself.

### Test Commands
```bash
# Deterministic unit tests (in root directory) — mocked axios adapter, no network
npm run test

# Consumer / live-node tests (each is a separate npm project; build the root first)
cd tests/nodejs-javascript && npm ci && npm test
cd tests/nodejs-typescript && npm ci && npm test
cd tests/browser-cdn && npm ci && npx playwright install chromium && npm run test
```

### Quality Checks (lint / format / type-check)
```bash
npm run format:check   # Prettier check (code only; src/api & build outputs ignored)
npm run format         # Prettier write
npm run lint           # ESLint
npm run lint:fix       # ESLint --fix
npm run type:check     # tsc --noEmit
```
The `lint` CI job runs `format:check`, `lint`, and `type:check`. ESLint uses the flat
config `eslint.config.js` (ESLint 9+, `@eslint/js` + `typescript-eslint` + `eslint-config-prettier`);
generated `src/api` and build outputs are excluded via its `ignores` (and `.prettierignore`
for Prettier).

### CI/CD Workflows

The project uses GitHub Actions. Both workflows run on a single unified runtime: **Java 21** and **Node.js 24.x**.

- **CI** (`ci-nodejs.yml`) - On pull requests and pushes to `main`: builds the client, runs all test suites in
  parallel (unit, nodejs-javascript, nodejs-typescript, browser-cdn), plus a `dry-run-publish` and a `pinact`
  job that verifies every action is SHA-pinned.
- **CD** (`cd-publish-to-npm.yml`) - Tag-triggered (`push` of a `v*` tag, created by `npm run release:*`)
  with a `workflow_dispatch` fallback: builds, tests, then publishes to npm via **OIDC Trusted Publishing**
  (no `NPM_TOKEN`; provenance attached). The whole pipeline is serialized via a `concurrency` group, and the
  `publish` job is gated by the `release` GitHub Environment (manual approval).

Releasing is one action: `npm run release:minor` (or `:patch` / `:major`) bumps the version, creates the
`vX.Y.Z` tag, and pushes it — which triggers CD.

Both workflows:
1. Build once and share `dist/` via a uniquely-named artifact; test jobs download it instead of rebuilding.
2. Run tests in parallel; live-node jobs are `continue-on-error: true` (non-gating). `dry-run-publish` only
   `needs: build` and validates the publishable `./dist` tarball with `npm pack --dry-run`.
3. Use `npm ci` for reproducible installs, gated by the full `npm audit --package-lock-only` (prod + dev, fails
   on any severity). The gating `test-unit` job additionally asserts the resolved axios is at/above the security
   floor — a check `npm audit` can't make when no advisory is filed yet. (A prod-only `--omit=dev` audit is
   intentionally NOT added: it is a strict subset of the full audit and would catch nothing extra.)
4. Pin all third-party actions to full commit SHAs (`pinact` / `.pinact.yaml`); Dependabot updates npm +
   actions daily with a 7-day cooldown.

## Security: axios floor & monitoring

- **Single source of truth**: the `axios` range and `overrides` (`form-data >= 4.0.4`,
  `follow-redirects >= 1.15.6`) in the root `package.json`. The published `package.json` is the hand-managed
  root one (`bundle.js` copies it into `dist/`), so the axios pin lives there — not in generator output.
- **Floor**: `axios ^1.17.0` (≥ the known-CVE-free `1.15.1`). The `test-unit` CI job fails if the resolved
  axios drops below `1.15.1`, proving the `overrides` took effect.
- **On every spec/dependency change, re-verify**: `npm audit` (optionally `--omit=dev` just to read the
  prod-only subset locally), the GitHub Advisory Database for `axios` / `form-data` / `follow-redirects`, and
  `npm view axios version`. Update the floor to the latest
  known-CVE-free 1.x.
- **Continuous**: Dependabot (security fixes are exempt from the 7-day cooldown) + the CI audit gates.
- **Install-time**: `.npmrc` sets `ignore-scripts=true` (blocks malicious postinstall in the deeper axios
  transitive tree) and `min-release-age=7` (local cooldown; `npm ci` is unaffected and gated by `npm audit`).

## Important Notes

- **DO NOT manually edit** files in `src/api/` - they are auto-generated.
- The OpenAPI spec is fetched from a pinned `symbol/symbol-openapi` GitHub release via `fetch-openapi.js`
  (no git submodule); SHA-256 is verified before use.
- Java is required for OpenAPI Generator CLI.
- Deterministic tests inject a custom `axios.create({ adapter })` instance as the **3rd `*RoutesApi`
  constructor argument** to capture requests without a network (see `src/*.spec.ts`).

## AI assistant configuration

This repo is set up so multiple coding agents share the same project instructions.

- **Instructions are single-sourced in `CLAUDE.md`.** `AGENTS.md` (OpenAI Codex CLI) and `GEMINI.md`
  (Gemini CLI) are symlinks to `CLAUDE.md` at each level (root, `src/api/`, `tests/`). Edit `CLAUDE.md`;
  the others follow automatically.
- **Claude Code** (`.claude/settings.json`): `permissions` deny/ask rules plus hooks — a PreToolUse guard
  that blocks catastrophic/RCE shell commands (`.claude/hooks/guard-bash.mjs`), a PostToolUse Prettier/ESLint
  auto-format, and a Stop-time `type:check` + `lint`.
- **Gemini CLI** (`.gemini/settings.json`): `tools.exclude` blocks dangerous shell commands. This is coarse
  prefix matching, so it is weaker than the Claude guard.
- **Codex CLI**: command safety is enforced by Codex's built-in OS sandbox and `approval_policy` in the
  user-global `~/.codex/config.toml` (no committed per-project deny-list).
