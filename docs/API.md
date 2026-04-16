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

Unified event ingestion API.

### Event Schema v1

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

### Minimal business input

SDK auto-normalizes missing fields so this is valid:

```ts
FlowPilot.emit({ name: "auth_login_success" });
```

Normalized defaults:

- `type`: `"ACTION"`
- `meta.timestamp`: `Date.now()`
- `meta.source`: `"system"`
- `meta.trigger`: `"manual"`
- `meta.page`: `getCurrentPage()` if provided, otherwise `window.location.pathname`

## `FlowPilot.reset()`

Resets current flow state.

## `FlowPilot.destroy()`

Destroys runtime and listeners.

## Step Completion Protocol

```ts
type Completion =
  | {
      type: "event";
      name?: string;
      match?: (event: FlowPilotEvent) => boolean;
    }
  | {
      type: "state";
      validator: (ctx: any) => boolean;
    };
```

### Completion semantics

1. SDK listens `ACTION` events only.
2. Only `completion.type === "event"` can advance a step.
3. Completion matches when `completion.name === event.name` or `completion.match(event)` is true.
4. `completion.type === "state"` is validation-only and never triggers `STEP_COMPLETE`.

### Default completion behavior

- `click`: default event completion matches `event.meta.trigger === "click"` and current step `guideId`.
- `route`: default event completion matches `event.meta.trigger === "route"`.
- `form`: no default completion; must define explicit event completion.

### Optional auto emit from step behavior

```ts
behavior: {
  type: "click",
  autoEmit: "menu_click_open_account",
  completion: { type: "event", name: "menu_click_open_account" }
}
```

`autoEmit` emits a derived `ACTION` event name and does not bypass completion checks.

## Built-in SDK event producers

- click bridge emits `sdk_click`
- form bridge emits `sdk_form_submit`
- route bridge emits `sdk_route_change`

All built-in events already follow Event Schema v1.

## Design principles

- FlowPilot does not detect behavior. FlowPilot consumes standardized events.
- Event is the single source of truth.
- No event -> No step completion.
