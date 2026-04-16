# Mapping 规范

Mapping 用于将 workflow 中的 UI key（`ui.xxx`）映射到真实 DOM 选择器。

## 示例

```json
{
  "ui.btn_login": {
    "selector": "[data-guide-id='ui.btn_login']",
    "fallback": ["#login-btn", ".login-btn"]
  }
}
```

## Mapping Entry 字段

- `selector`：主选择器
- `fallback?`：备用选择器列表
- `pages?`：可选的页面白名单

## 规则建议

- 使用一致命名：`ui.<feature>_<element>`。
- 选择器尽量稳定、可测试。
- 优先使用 `data-guide-id`，避免过深 CSS 路径。
