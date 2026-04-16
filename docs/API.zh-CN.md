# API 参考

## 全局对象

使用 UMD 构建时，`FlowPilot` 会挂载到 `window`。

## `FlowPilot.version`

返回 SDK 版本号字符串。

## `FlowPilot.init(config)`

初始化运行时（同一页面生命周期仅初始化一次）。

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

## `FlowPilot.start(taskId)`

按任务 id 启动引导。

- `taskId`: `string`

## `FlowPilot.emit(event)`

统一行为协议 API。

```ts
FlowPilot.emit({
  type: "ACTION",
  name: "login_success",
  payload: { userId: "u_123" }
});
```

事件结构：

```ts
type ActionEvent = {
  type: "ACTION";
  name: string;
  payload?: any;
};
```

## `FlowPilot.reset()`

重置当前引导状态。

## `FlowPilot.destroy()`

销毁运行时和监听器。

## 行为协议 v1（emit-only）

步骤完成只通过 emit 触发。

```ts
type Completion = {
  type: "event";
  name: string;
  validator?: (payload: any) => boolean;
};
```

### 完成语义

1. SDK 监听 `ACTION` 事件。
2. 当 `event.name === step.behavior.completion.name` 时，步骤可完成。
3. 若配置了 `validator`，先校验再推进。

```ts
if (completion.validator && !completion.validator(event.payload)) {
  return;
}
// then STEP_COMPLETE
```

### bridge 可选 autoEmit

可在步骤行为中配置 `autoEmit`：

```json
{
  "behavior": {
    "type": "click",
    "autoEmit": "menu_open_account_clicked",
    "completion": { "type": "event", "name": "menu_open_account_clicked" }
  }
}
```

bridge 不再直接完成步骤，只能做可选 ACTION 触发。

## 内置行为来源

- `click`：用于可选 `autoEmit`
- `form submit`：用于可选 `autoEmit` 与上下文采集
- `route`：用于可选 `autoEmit`

SDK 不再做网络拦截：

- 不劫持 `fetch`
- 不监听 `axios`
