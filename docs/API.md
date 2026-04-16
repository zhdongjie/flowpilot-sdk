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

Unified behavior protocol API.

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

## Behavior Protocol v1 (emit-only)

Step completion is emit-driven only.

```ts
type Completion = {
  type: "event";
  name: string;
  validator?: (payload: any) => boolean;
};
```

### Completion semantics

1. SDK listens `ACTION` events.
2. If `event.name === step.behavior.completion.name`, step can complete.
3. If `validator` exists, SDK checks it first.

```ts
if (completion.validator && !completion.validator(event.payload)) {
  return;
}
// then STEP_COMPLETE
```

### Optional auto emit from bridge

You can configure optional `autoEmit` in step behavior.

```json
{
  "behavior": {
    "type": "click",
    "autoEmit": "menu_open_account_clicked",
    "completion": { "type": "event", "name": "menu_open_account_clicked" }
  }
}
```

Bridges no longer complete steps directly; they can only produce optional ACTION emissions.

## Built-in behavior sources

- `click`: DOM capture for optional `autoEmit`
- `form submit`: context capture for optional `autoEmit`
- `route`: route capture for optional `autoEmit`

No SDK network interception:

- no `fetch` hijack
- no `axios` hook
