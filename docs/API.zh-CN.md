# API 参考

## 全局对象

使用 UMD 构建时，`FlowPilot` 会挂载到 `window`。

## `FlowPilot.version`

返回 SDK 版本号字符串。

## `FlowPilot.init(config)`

初始化运行时（同一页面生命周期只应初始化一次）。

### `config` 字段

- `workflow`: `Workflow | Workflow[]`
- `mapping?`: `Record<string, string | MappingEntry>`
- `debug?`: `boolean`
- `autoStart?`: `boolean`
- `getCurrentPage?`: `() => string`
- `getState?`: `() => Record<string, any>`
- `onStepChange?`: `(step) => void`
- `onFinish?`: `() => void`
- `onError?`: `(error) => void`

### 后端驱动配置模式

前端可直接请求 JSON 配置并初始化：

```js
const config = await fetch("/flowpilot/config").then((r) => r.json());
FlowPilot.init({
  workflow: config.workflow,
  mapping: config.mapping
});
```

## `FlowPilot.start(taskId)`

按任务 id 启动引导流程。

- `taskId`: `string`

## `FlowPilot.reset()`

重置当前引导状态与运行状态。

## `FlowPilot.destroy()`

销毁运行时、监听器与 Shadow DOM 容器。

## Completion Rule DSL（`step.behavior.completion.rule`）

当你希望使用纯 JSON 配置（前端不拼函数）时，使用 rule DSL。

### 示例

```json
{
  "type": "form",
  "completion": {
    "type": "event",
    "rule": {
      "all": [
        { "field": "source", "op": "eq", "value": "fetch" },
        { "field": "ok", "op": "eq", "value": true },
        { "field": "url", "op": "includes", "value": "/auth/login" },
        { "field": "status", "op": "eq", "value": 200 }
      ]
    }
  }
}
```

### 操作符

- `eq`：严格相等
- `neq`：严格不等
- `includes`：字符串包含或数组包含
- `in`：值是否在给定数组中
- `exists`：字段是否存在（`true`）或不存在（`false`）
- `truthy`：JS truthy
- `falsy`：JS falsy
- `match`：正则匹配（模式字符串）

### 规则组合

- `all`：全部子规则命中
- `any`：任一子规则命中
- `not`：对子规则取反

## 自动捕获行为事件

SDK bridge 层会自动捕获：

- `click`
- `form submit`
- `route changes`
- `fetch / axios responses`

这些事件用于行为驱动的步骤完成判定。
