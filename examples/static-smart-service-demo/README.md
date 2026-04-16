# Static Smart Service Demo

A pure static HTML demo (no framework) that mirrors the smart-service integration flow.

## Entry

- `index.html`

## What this demo includes

- Smart service entry in business/test layer
- Mock API simulation in browser
- Backend-style `/flowpilot/config` loading and `FlowPilot.init`
- Guided start via `FlowPilot.start("open_account")`

## Run (recommended)

From repository root:

```bash
python -m http.server 5173
```

Then open:

- `http://localhost:5173/examples/static-smart-service-demo/index.html`
