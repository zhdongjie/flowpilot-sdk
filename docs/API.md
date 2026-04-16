# API Reference

## Global Object

When using UMD build, `FlowPilot` is exposed on `window`.

## `FlowPilot.version`

Returns SDK runtime version string.

## `FlowPilot.init(config)`

Initializes the runtime once per page lifecycle.

### `config`

- `workflow`: `Workflow | Workflow[]`
- `mapping?`: `Record<string, string | MappingEntry>`
- `debug?`: `boolean`
- `autoStart?`: `boolean`
- `getCurrentPage?`: `() => string`
- `getState?`: `() => Record<string, any>`
- `onStepChange?`: `(step) => void`
- `onFinish?`: `() => void`
- `onError?`: `(error) => void`

### Backend-driven config pattern

Frontend can load JSON from backend and pass it directly:

```js
const config = await fetch("/flowpilot/config").then((r) => r.json());
FlowPilot.init({
  workflow: config.workflow,
  mapping: config.mapping
});
```

## `FlowPilot.start(taskId)`

Starts a workflow by id.

- `taskId`: `string`

## `FlowPilot.reset()`

Resets current flow state and active runtime status.

## `FlowPilot.destroy()`

Destroys runtime, listeners, and Shadow DOM host.

## Completion Rule DSL (`step.behavior.completion.rule`)

Use rule DSL when you want pure JSON config (no frontend function assembly).

### Example

```json
{
  "type": "form",
  "completion": {
    "type": "event",
    "rule": {
      "all": [
        { "field": "source", "op": "eq", "value": "fetch" },
        { "field": "ok", "op": "eq", "value": true },
        { "field": "url", "op": "includes", "value": "/auth/login" },
        { "field": "status", "op": "eq", "value": 200 }
      ]
    }
  }
}
```

### Operators

- `eq`: strict equals
- `neq`: strict not equals
- `includes`: string contains or array contains
- `in`: value exists in provided array
- `exists`: field exists (`true`) or does not exist (`false`)
- `truthy`: JS truthy
- `falsy`: JS falsy
- `match`: regex match (pattern string)

### Rule composition

- `all`: all child rules must match
- `any`: at least one child rule matches
- `not`: negates a child rule

## Auto-captured behavior events

SDK bridge layer captures:

- `click`
- `form submit`
- `route changes`
- `fetch / axios responses`

These events are used for behavior-based step completion.
