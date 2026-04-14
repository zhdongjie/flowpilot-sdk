# Build Strategy (Local)

This project uses Vite in library mode. The local build produces UMD + ESM artifacts and can target a custom output directory.

## Requirements

- Node.js + npm
- Run `npm install` once before building

## Default Build (Local)

```bash
npm run build
```

Artifacts:

- `dist/flowpilot.umd.js`
- `dist/flowpilot.esm.js`

## Custom Output Directory

You can package to a specified directory using either CLI flags or an environment variable.

### Option A: CLI Override

```bash
npm run build -- --outDir E:\\release\\flowpilot-sdk
```

macOS/Linux:

```bash
npm run build -- --outDir /tmp/flowpilot-sdk
```

### Option B: Environment Variable (Recommended)

PowerShell:

```powershell
$env:FLOWPILOT_OUT_DIR = "E:\\release\\flowpilot-sdk"
npm run build
```

CMD (Windows):

```bat
set FLOWPILOT_OUT_DIR=E:\release\flowpilot-sdk
npm run build
```

Bash:

```bash
FLOWPILOT_OUT_DIR=./release/flowpilot-sdk npm run build
```

## Safety Note

`emptyOutDir` is enabled, so the target directory will be cleared before each build. Use a dedicated folder for build outputs.
