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



