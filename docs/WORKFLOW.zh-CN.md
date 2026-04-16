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
          "name": "auth_login_success"
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

## 完成模型（Event-only）

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

- 只有 `event` completion 可以触发 `STEP_COMPLETE`。
- `state` completion 只用于校验上下文，不触发完成。
- `form` 不提供默认 completion，必须显式定义 `event` completion。

## 默认行为 completion

- `click`：默认匹配 `event.meta.trigger === "click"` 且命中当前步骤 `guideId`。
- `route`：默认匹配 `event.meta.trigger === "route"`。
- `form`：不生成默认 completion。

## 可选 autoEmit

```ts
behavior: {
  type: "click",
  autoEmit: "menu_click_open_account",
  completion: { type: "event", name: "menu_click_open_account" }
}
```

`autoEmit` 会派生一个新的 `ACTION` 事件名，但仍遵循 event-only 完成机制。

## 建议实践

- 每个步骤只表达一个明确动作。
- 使用稳定的 `highlight` key（`ui.xxx`），选择器放到 mapping。
- 业务侧事件名建议统一为 `<domain>_<action>_<result?>`。
- 关键业务节点优先在业务代码里显式 `FlowPilot.emit`。
