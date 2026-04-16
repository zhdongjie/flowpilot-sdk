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
          "name": "login_form_filled"
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

## Completion Modes

```ts
type Completion =
  | { type: "event"; name: string }
  | { type: "state"; validator: (ctx: any) => boolean };
```

## Best Practices

- Keep one clear user action per step.
- Use stable `highlight` keys (`ui.xxx`) and map selectors separately.
- Prefer event completion (`type: "event"`) for backend-delivered JSON workflows.
- Use `FlowPilot.emit({ type: "ACTION", name })` in business code to advance steps.
