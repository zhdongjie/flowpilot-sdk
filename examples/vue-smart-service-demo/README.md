# Vue Smart Service Demo

A standalone Vue demo that shows how to integrate FlowPilot with a smart-service style business UI.

## What this demo includes

- Vue UI for login, menu, and account opening form
- Smart service panel in business layer
- Mock API simulation (`/flowpilot/config`, `/chat`, `/auth/login`, `/account/open`)
- Direct SDK init from backend-style JSON config

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Notes

- SDK bundle is loaded from `public/flowpilot/`.
- This demo is intentionally independent from Python backend runtime.
