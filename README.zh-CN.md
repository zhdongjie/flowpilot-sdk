# FlowPilot

FlowPilot 是一个前端引导 SDK，用于在产品中实现分步式任务引导与操作指导。

![FlowPilot demo](docs/demo.gif)

语言版本：

- English: [README.md](README.md)
- 简体中文: `README.zh-CN.md`

## 核心能力

- 基于 Workflow 的引导运行时
- UI 映射机制（`ui.xxx -> selector`）
- Shadow DOM 高亮与提示渲染
- 自动行为捕获（`click`、`form`、`route`）
- 通过 `FlowPilot.emit` 统一动作协议

## Event Schema v1

- FlowPilot 使用统一 `ACTION` 事件结构覆盖 `click | route | form | emit | AI` 来源。
- 步骤推进只认事件（`No event -> No step completion`）。
- `state` 仅用于校验上下文，不触发 completion。
- `form` 步骤不生成默认 completion，必须显式定义 event completion。

```ts
type FlowPilotEvent = {
  type: "ACTION";
  name: string;
  payload?: any;
  meta: {
    timestamp: number;
    source: "user" | "system" | "sdk" | "ai";
    trigger: "click" | "route" | "form" | "api" | "manual";
    page: string;
    stepId?: number;
    workflowId?: string;
    element?: {
      selector?: string;
      guideId?: string;
      text?: string;
    };
    context?: Record<string, any>;
  };
};
```

### 设计原则

- FlowPilot does not detect behavior. FlowPilot consumes standardized events.
- Event is the single source of truth.
- No event -> No step completion.

## 安装

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/flowpilot@0.1.0/dist/flowpilot.umd.js"></script>
```

### 本地构建

```bash
npm install
npm run build
```

更多构建方式请见 [docs/BUILD.zh-CN.md](docs/BUILD.zh-CN.md)。

## 快速开始

```html
<button data-guide-id="ui.btn_login">Login</button>

<script src="./dist/flowpilot.umd.js"></script>
<script>
  FlowPilot.init({
    workflow: {
      id: "open_account",
      steps: [
        {
          step: 1,
          highlight: "ui.btn_login",
          action: "Click login"
        }
      ]
    },
    mapping: {
      "ui.btn_login": {
        selector: "[data-guide-id='ui.btn_login']"
      }
    }
  });

  FlowPilot.start("open_account");
</script>
```

## 后端驱动配置（前端零组装）

前端可直接请求后端配置并传入 `FlowPilot.init`。
步骤完成由配置中的行为事件显式控制。

```js
const config = await fetch("/flowpilot/config").then((r) => r.json());
FlowPilot.init({
  workflow: config.workflow,
  mapping: config.mapping
});
```

```js
FlowPilot.emit({ name: "auth_login_success" });
```

Event Schema v1 见 [docs/API.zh-CN.md](docs/API.zh-CN.md)。

## 责任边界

智能客服 / AI 对话 UI 属于业务层或测试项目，不属于 SDK 内核。

- SDK：引导运行时能力（`init/start/reset/destroy`）
- 业务项目：意图识别与 `FlowPilot.start(taskId)` 调用

示例：

- [examples/vue-smart-service-demo](examples/vue-smart-service-demo)
- [examples/static-smart-service-demo](examples/static-smart-service-demo)

## 文档

- [docs/README.zh-CN.md](docs/README.zh-CN.md)
- [docs/API.zh-CN.md](docs/API.zh-CN.md)
- [docs/WORKFLOW.zh-CN.md](docs/WORKFLOW.zh-CN.md)
- [docs/MAPPING.zh-CN.md](docs/MAPPING.zh-CN.md)
- [docs/BUILD.zh-CN.md](docs/BUILD.zh-CN.md)
- [docs/RELEASE.zh-CN.md](docs/RELEASE.zh-CN.md)
- [docs/CHANGELOG.zh-CN.md](docs/CHANGELOG.zh-CN.md)

## 社区与治理

- [docs/CONTRIBUTING.zh-CN.md](docs/CONTRIBUTING.zh-CN.md)
- [docs/CODE_OF_CONDUCT.zh-CN.md](docs/CODE_OF_CONDUCT.zh-CN.md)
- [docs/SECURITY.zh-CN.md](docs/SECURITY.zh-CN.md)

## 许可证

[MIT](LICENSE)
