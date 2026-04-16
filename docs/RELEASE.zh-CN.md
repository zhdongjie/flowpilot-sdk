# 发布指南

本文档说明 FlowPilot SDK 的发布流程。

## 1. 发布前检查

- 确认发布相关文件变更清晰。
- 更新 `package.json` 版本号。
- 更新 [CHANGELOG.md](CHANGELOG.md)。
- 检查文档一致性（`README.md`、`docs/*`）。

## 2. 构建产物

在仓库根目录执行：

```bash
npm install
npm run build:all
```

预期产物：

- `dist/flowpilot.umd.js`
- `dist/flowpilot.umd.min.js`
- `dist/flowpilot.esm.js`
- `dist/flowpilot.esm.min.js`

## 3. 烟雾验证

静态示例：

```bash
python -m http.server 5173
```

访问：

- `http://localhost:5173/examples/static-smart-service-demo/index.html`

Vue 示例：

```bash
cd examples/vue-smart-service-demo
npm install
npm run dev
```

## 4. 打包校验（可选）

```bash
npm pack
```

检查 tarball 是否包含预期源码/文档，并排除临时文件。

## 5. 发布

```bash
npm publish
```

如需 prerelease/tag，请按团队发布策略执行。

## 6. 发布后

- 创建 Git Tag（例如 `v0.1.1`）
- 推送发布提交与标签
- 基于 changelog 生成发布说明
