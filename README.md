# FlowPilot

FlowPilot is a frontend guidance SDK for step-by-step product onboarding and task execution.

![FlowPilot demo](docs/demo.gif)

Language:

- English: `README.md`
- 简体中文: [README.zh-CN.md](README.zh-CN.md)

## Highlights

- Workflow-driven guidance runtime
- UI element mapping (`ui.xxx -> selector`)
- Highlight + tooltip rendering in Shadow DOM
- Auto behavior capture for `click`, `form`, and `route`
- Unified action protocol via `FlowPilot.emit`

## Event Schema v1

- FlowPilot uses a standardized `ACTION` event schema for `click | route | form | emit | AI` sources.
- Step completion is event-only (`No event -> No step completion`).
- `state` remains validation-only context and is not a completion trigger.
- `form` steps do not get default completion; they must define explicit event completion.

```ts
type FlowPilotEvent = {
  type: "ACTION";
  name: string;
  payload?: any;
  meta: {
    timestamp: number;
    source: "user" | "system" | "sdk" | "ai";
    trigger: "click" | "route" | "form" | "api" | "manual";
    page: string;
    stepId?: number;
    workflowId?: string;
    element?: {
      selector?: string;
      guideId?: string;
      text?: string;
    };
    context?: Record<string, any>;
  };
};
```

### Design Principles

- FlowPilot does not detect behavior. FlowPilot consumes standardized events.
- Event is the single source of truth.
- No event -> No step completion.

## Installation

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/flowpilot@0.1.0/dist/flowpilot.umd.js"></script>
```

### Build from source

```bash
npm install
npm run build
```

More build options: [docs/BUILD.md](docs/BUILD.md)

## Quick Start

```html
<button data-guide-id="ui.btn_login">Login</button>

<script src="./dist/flowpilot.umd.js"></script>
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
  });

  FlowPilot.start("open_account");
</script>
```

## Backend-Driven Config (No Frontend Assembly)

Frontend can fetch workflow JSON from backend and pass it directly to `FlowPilot.init`.
Step completion is controlled by configured behavior events.

```js
const config = await fetch("/flowpilot/config").then((r) => r.json());
FlowPilot.init({
  workflow: config.workflow,
  mapping: config.mapping
});
```

```js
FlowPilot.emit({ name: "auth_login_success" });
```

See [docs/API.md](docs/API.md) for Event Schema v1.

## Scope Boundary

Customer service or AI chat UI belongs to business/test projects, not the SDK core.

- SDK: guidance runtime (`init/start/reset/destroy`)
- Business project: intent routing and calling `FlowPilot.start(taskId)`

Examples:

- [examples/vue-smart-service-demo](examples/vue-smart-service-demo)
- [examples/static-smart-service-demo](examples/static-smart-service-demo)

## Documentation

- [docs/README.md](docs/README.md)
- [docs/API.md](docs/API.md)
- [docs/WORKFLOW.md](docs/WORKFLOW.md)
- [docs/MAPPING.md](docs/MAPPING.md)
- [docs/BUILD.md](docs/BUILD.md)
- [docs/RELEASE.md](docs/RELEASE.md)
- [docs/CHANGELOG.md](docs/CHANGELOG.md)

## Community and Governance

- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- [docs/CODE_OF_CONDUCT.md](docs/CODE_OF_CONDUCT.md)
- [docs/SECURITY.md](docs/SECURITY.md)

## License

[MIT](LICENSE)
