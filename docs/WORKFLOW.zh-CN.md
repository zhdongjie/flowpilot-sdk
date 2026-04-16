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

## Step 字段

- `step`：步骤序号
- `type`：`click | form | route`
- `page?`：步骤所属页面路径
- `highlight`：通过 mapping 解析的 UI key
- `action?`：用户动作文案
- `desc?`：补充说明文案
- `form?`：表单字段元信息
- `behavior?`：完成条件定义

## 完成模型（emit-only）

```ts
type Completion = {
  type: "event";
  name: string;
  validator?: (payload: any) => boolean;
};
```

## 可选 autoEmit

```ts
behavior: {
  type: "click",
  autoEmit: "menu_open_account_clicked",
  completion: { type: "event", name: "menu_open_account_clicked" }
}
```

`autoEmit` 只是便捷触发方式，本质仍通过 `ACTION` 事件推进步骤。

## 建议实践

- 每个步骤只表达一个明确动作。
- 使用稳定的 `highlight` key（`ui.xxx`），选择器放到 mapping。
- 关键业务节点优先在业务代码里显式 `FlowPilot.emit`。
- `autoEmit` 仅用于确定性强的 UI 行为。
