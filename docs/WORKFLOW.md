# Workflow Specification

A workflow is the core guidance definition.

## Schema (simplified)

```json
{
  "id": "open_account",
  "steps": [
    {
      "step": 1,
      "type": "form",
      "page": "/home",
      "highlight": "ui.form_login",
      "action": "Validate login form",
      "behavior": {
        "type": "form",
        "completion": {
          "type": "event",
          "name": "auth_login_success"
        }
      }
    }
  ]
}
```

## Step Fields

- `step`: numeric order id
- `type`: `click | form | route`
- `page?`: page path for route context
- `highlight`: UI key resolved by mapping
- `action?`: user-facing action text
- `desc?`: optional reason text
- `form?`: form fields metadata
- `behavior?`: completion behavior

## Completion Model (Event-only)

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

- Only `event` completion can trigger `STEP_COMPLETE`.
- `state` completion is validation-only context and cannot trigger completion.
- `form` has no default completion and must explicitly define an `event` completion.

## Default behavior completion

- `click`: defaults to `event.meta.trigger === "click"` and same step `guideId`.
- `route`: defaults to `event.meta.trigger === "route"`.
- `form`: no default completion.

## Optional auto emit

```ts
behavior: {
  type: "click",
  autoEmit: "menu_click_open_account",
  completion: { type: "event", name: "menu_click_open_account" }
}
```

`autoEmit` emits a derived `ACTION` event name and still follows event-only completion.

## Best Practices

- Keep one clear user action per step.
- Use stable `highlight` keys (`ui.xxx`) and map selectors separately.
- Use semantic event names (`<domain>_<action>_<result?>`) in business emits.
- Prefer explicit `FlowPilot.emit` in business code for critical transitions.
