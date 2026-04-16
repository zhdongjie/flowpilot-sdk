# Mapping Specification

Mapping links workflow UI keys (`ui.xxx`) to real DOM selectors.

## Example

```json
{
  "ui.btn_login": {
    "selector": "[data-guide-id='ui.btn_login']",
    "fallback": ["#login-btn", ".login-btn"]
  }
}
```

## Mapping Entry

- `selector`: primary selector
- `fallback?`: optional fallback selectors
- `pages?`: optional page allowlist

## Rules

- Use consistent key naming: `ui.<feature>_<element>`.
- Keep selectors stable and test-friendly.
- Prefer `data-guide-id` attributes over deep CSS chains.
