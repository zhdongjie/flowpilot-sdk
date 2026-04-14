# FlowPilot

> FlowPilot is a pluggable frontend guidance SDK that teaches users step-by-step.

![FlowPilot demo](docs/demo.gif)

> Replace `docs/demo.gif` with a real walkthrough recording (highlight + step guidance).

```js
FlowPilot.init(...)
FlowPilot.start(...)
FlowPilot.destroy()
```

---

## Features

- Workflow-driven guidance
- Element highlighting (Mapping)
- Tooltip and chat guidance
- Plugin-style integration (no system intrusion)

---

## Installation

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/flowpilot@0.1.0/dist/flowpilot.umd.js"></script>
```

---

## Local Build

```bash
npm install
npm run build
```

Custom output directory (CLI):

```bash
npm run build -- --outDir E:\release\flowpilot-sdk
```

Custom output directory (CLI, macOS/Linux):

```bash
npm run build -- --outDir /tmp/flowpilot-sdk
```

Custom output directory (PowerShell, Windows):

```powershell
$env:FLOWPILOT_OUT_DIR = "E:\release\flowpilot-sdk"
npm run build
```

Custom output directory (CMD, Windows):

```bat
set FLOWPILOT_OUT_DIR=E:\release\flowpilot-sdk
npm run build
```

Custom output directory (macOS/Linux):

```bash
FLOWPILOT_OUT_DIR=/tmp/flowpilot-sdk npm run build
```

See `docs/BUILD.md` for full options.

---

## Quick Start

```html
<button data-guide-id="ui.btn_login">Login</button>

<script>
FlowPilot.init({
  workflow: {
    id: "open_account",
    steps: [
      {
        step: 1,
        highlight: "ui.btn_login",
        action: "Click login"
      }
    ]
  },
  mapping: {
    "ui.btn_login": {
      selector: "[data-guide-id='ui.btn_login']"
    }
  }
})

FlowPilot.start("open_account")
</script>
```

---

## API

### init

```js
FlowPilot.init(config)
```

### start

```js
FlowPilot.start(taskId)
```

### next

```js
FlowPilot.next()
```

### reset

```js
FlowPilot.reset()
```

### destroy

```js
FlowPilot.destroy()
```

---

## Docs

- docs/API.md
- docs/WORKFLOW.md
- docs/MAPPING.md

---

## Philosophy

FlowPilot = Workflow + Mapping + Runtime

---

## License

MIT



