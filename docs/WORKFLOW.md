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
      "action": "Fill in login form fields",
      "behavior": {
        "type": "form",
        "completion": {
          "type": "state",
          "rule": {
            "all": [
              { "field": "source", "op": "eq", "value": "form" },
              { "field": "formData.phone", "op": "truthy" },
              { "field": "formData.code", "op": "truthy" }
            ]
          }
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

## Best Practices

- Keep one clear user action per step.
- Use stable `highlight` keys (`ui.xxx`) and map selectors separately.
- Prefer JSON `completion.rule` for backend-delivered config.
- Keep workflow business-specific; keep SDK generic.
