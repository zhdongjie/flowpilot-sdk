# Release Guide

This guide describes how to prepare and publish a FlowPilot SDK release.

## 1. Pre-Release Checklist

- Ensure working tree is clean for release-related files.
- Update version in `package.json`.
- Update [CHANGELOG.md](CHANGELOG.md).
- Confirm docs are consistent (`README.md`, `docs/*`).

## 2. Build Artifacts

From repository root:

```bash
npm install
npm run build:all
```

Expected output files:

- `dist/flowpilot.umd.js`
- `dist/flowpilot.umd.min.js`
- `dist/flowpilot.esm.js`
- `dist/flowpilot.esm.min.js`

## 3. Smoke Test

Run static examples:

```bash
python -m http.server 5173
```

Open:

- `http://localhost:5173/examples/static-smart-service-demo/index.html`

Run Vue example:

```bash
cd examples/vue-smart-service-demo
npm install
npm run dev
```

## 4. Package Validation

Optional local package check:

```bash
npm pack
```

Verify tarball includes expected source/docs and excludes temporary files.

## 5. Publish

Publish to npm (when ready):

```bash
npm publish
```

If using tags/prereleases, follow your team release policy.

## 6. Post-Release

- Create Git tag (for example `v0.1.1`).
- Push release commit and tag.
- Announce release notes based on changelog entries.
