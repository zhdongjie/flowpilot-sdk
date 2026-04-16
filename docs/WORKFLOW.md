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

## Completion Model (emit-only)

```ts
type Completion = {
  type: "event";
  name: string;
  validator?: (payload: any) => boolean;
};
```

## Optional auto emit

```ts
behavior: {
  type: "click",
  autoEmit: "menu_open_account_clicked",
  completion: { type: "event", name: "menu_open_account_clicked" }
}
```

`autoEmit` is optional convenience. It still advances steps through `ACTION` events only.

## Best Practices

- Keep one clear user action per step.
- Use stable `highlight` keys (`ui.xxx`) and map selectors separately.
- Prefer explicit `FlowPilot.emit` in business code for critical transitions.
- Use `autoEmit` only for deterministic UI actions.
