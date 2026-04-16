# Workflow 规范

Workflow 是引导配置的核心定义。

## 简化结构示例

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

## Step 字段

- `step`：步骤序号
- `type`：`click | form | route`
- `page?`：步骤所属页面路径
- `highlight`：通过 mapping 解析的 UI key
- `action?`：用户动作文案
- `desc?`：补充说明文案
- `form?`：表单字段元信息
- `behavior?`：完成条件定义

## 建议实践

- 每个步骤只表达一个明确动作。
- 使用稳定的 `highlight` key（`ui.xxx`），选择器放到 mapping。
- 后端下发场景建议优先使用 JSON `completion.rule`。
- Workflow 保持业务表达，SDK 保持通用能力。
