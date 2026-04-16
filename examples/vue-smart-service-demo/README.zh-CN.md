# Vue 智能客服示例

这是一个独立的 Vue 示例，展示如何在业务层智能客服界面中集成 FlowPilot。

## 示例包含

- Vue 登录页、菜单页、开户表单页
- 业务层智能客服面板
- Mock 接口模拟（`/flowpilot/config`、`/chat`、`/auth/login`、`/account/open`）
- 直接使用后端风格 JSON 配置初始化 SDK
- 通过 `FlowPilot.emit({ type: "ACTION", name })` 控制步骤推进

## 运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 说明

- SDK 产物从 `public/flowpilot/` 加载。
- 该示例刻意不依赖 Python 后端运行时。
