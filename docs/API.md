# API Reference

## Global Object

When using UMD build, `FlowPilot` is exposed on `window`.

## `FlowPilot.version`

Returns SDK runtime version string.

## `FlowPilot.init(config)`

Initializes runtime once per page lifecycle.

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

## `FlowPilot.start(taskId)`

Starts a workflow by id.

- `taskId`: `string`

## `FlowPilot.emit(event)`

Unified non-intrusive behavior event API.

```ts
FlowPilot.emit({
  type: "ACTION",
  name: "login_success",
  payload: { userId: "u_123" }
});
```

Event shape:

```ts
type ActionEvent = {
  type: "ACTION";
  name: string;
  payload?: any;
};
```

## `FlowPilot.reset()`

Resets current flow state.

## `FlowPilot.destroy()`

Destroys runtime and listeners.

## Behavior Protocol v1

Behavior completion supports two modes:

```ts
type Completion =
  | { type: "event"; name: string }
  | { type: "state"; validator: (ctx: any) => boolean };
```

### Event mode (recommended for backend JSON configs)

```json
{
  "type": "event",
  "name": "login_success"
}
```

SDK completes the active step when `FlowPilot.emit({ type: "ACTION", name: "login_success" })` is called.

### State mode

Use function validator for in-code configurations.

## Built-in automatic sources

- `click`: kept as DOM-based automatic behavior.
- `form`: captured for context, but not auto-completed unless validator is configured.
- `fetch/axios`: no SDK interception, no SDK network hijacking.

This keeps runtime non-intrusive and behavior fully controllable.
