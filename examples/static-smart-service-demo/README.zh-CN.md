# 静态智能客服示例

这是一个纯静态 HTML 示例（无框架），用于复现智能客服集成链路。

## 入口文件

- `index.html`

## 示例包含

- 业务/测试层智能客服入口
- 浏览器内 Mock 接口模拟
- 按后端风格加载 `/flowpilot/config` 并 `FlowPilot.init`
- 通过 `FlowPilot.start("open_account")` 启动引导

## 运行（推荐）

在仓库根目录执行：

```bash
python -m http.server 5173
```

然后访问：

- `http://localhost:5173/examples/static-smart-service-demo/index.html`
