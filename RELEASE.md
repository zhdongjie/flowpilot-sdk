# FlowPilot SDK v0.1 发布包

本发布包包含：

* `dist/flowpilot.umd.js`（UMD 主文件）
* `dist/flowpilot.esm.js`（ESM 模块）
* `examples/basic.html`（最小示例）
* `README.md`（SDK 文档）

---

## 发布前检查

1. 构建 SDK
```bash
cd E:\Project\Python\flowpilot-sdk
npm install
npm run build
```

2. 打开 Demo 验证
```bash
cd E:\Project\Python\flowpilot-sdk
python -m http.server 5173
```

访问：
```
http://localhost:5173/examples/basic.html
```

---

## 接入方式（示例）

```html
<script src="flowpilot.umd.js"></script>
<script>
FlowPilot.init({
  workflow,
  mapping
})
FlowPilot.start("open_account")
</script>
```
