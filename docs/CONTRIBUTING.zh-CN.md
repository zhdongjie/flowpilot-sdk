# 贡献指南

感谢你关注并参与 FlowPilot 项目。

## 开发准备

```bash
npm install
npm run build
```

## 分支建议

- 从主分支创建简洁的特性/修复分支。
- 每个 PR 聚焦单一主题。

## Pull Request 检查清单

- 行为或 API 变更需同步更新文档。
- 面向用户的关键变更需更新 [CHANGELOG.md](CHANGELOG.md)。
- 本地构建通过：`npm run build:all`。
- 若运行时行为变化，请确保示例仍可运行。

## 提交信息建议

建议使用清晰的 scoped message，例如：

- `feat(runtime): add JSON completion rule evaluator`
- `docs(api): document completion rule operators`

## 问题反馈建议

提交 bug 时请附带：

- 环境信息（浏览器、系统）
- 复现步骤
- 期望行为与实际行为
- 相关 workflow/mapping 配置（如适用）

## 行为准则

请遵守 [CODE_OF_CONDUCT.zh-CN.md](CODE_OF_CONDUCT.zh-CN.md)。
