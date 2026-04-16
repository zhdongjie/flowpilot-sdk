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

统一的非侵入行为事件 API。

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

## 行为协议 v1

步骤完成条件支持两种模式：

```ts
type Completion =
  | { type: "event"; name: string }
  | { type: "state"; validator: (ctx: any) => boolean };
```

### 事件模式（推荐用于后端 JSON 配置）

```json
{
  "type": "event",
  "name": "login_success"
}
```

当调用 `FlowPilot.emit({ type: "ACTION", name: "login_success" })` 时，SDK 会完成当前步骤。

### 状态模式

用于代码内配置函数型校验器。

## 内置自动来源

- `click`：保留 DOM 自动行为。
- `form`：仅采集上下文，不自动完成；需显式配置 validator 才能自动完成。
- `fetch/axios`：SDK 不再拦截，不再做网络劫持。

这样可以保证运行时非侵入、行为可控。
