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
- Auto behavior capture for `click`, `form`, `route`, and `fetch`
- Backend-driven JSON config support (`completion.rule`)

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

FlowPilot supports declarative completion rules in JSON.
Your frontend can fetch config from backend and pass it directly to `FlowPilot.init`.

```js
const config = await fetch("/flowpilot/config").then((r) => r.json());
FlowPilot.init({
  workflow: config.workflow,
  mapping: config.mapping
});
```

See [docs/API.md](docs/API.md) for `completion.rule` syntax.

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
