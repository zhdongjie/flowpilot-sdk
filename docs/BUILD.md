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

## Minified Build (terser)

PowerShell:

```powershell
$env:MINIFY = "true"
npm run build
```

CMD (Windows):

```bat
set MINIFY=true
npm run build
```

macOS/Linux:

```bash
MINIFY=true npm run build
```

### Minified Build with Custom Output Directory

PowerShell:

```powershell
$env:MINIFY = "true"
$env:FLOWPILOT_OUT_DIR = "E:\\release\\flowpilot-sdk"
npm run build
```

CMD (Windows):

```bat
set MINIFY=true
set FLOWPILOT_OUT_DIR=E:\release\flowpilot-sdk
npm run build
```

macOS/Linux:

```bash
MINIFY=true FLOWPILOT_OUT_DIR=/tmp/flowpilot-sdk npm run build
```

### Script Shortcuts (Cross-Platform)

```bash
npm run build
npm run build:min
npm run build:all
npm run clean
```

Minify + custom output (script shortcut):

```bash
npm run build:min -- --outDir /tmp/flowpilot-sdk
```

Build both (min + non-min) with custom output:

```bash
npm run build:all -- --outDir /tmp/flowpilot-sdk
```

## Safety Note

`emptyOutDir` is disabled to allow both minified and non-minified outputs to coexist. Clean the output directory manually when needed.
