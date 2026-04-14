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

支持指定输出目录：

```bash
npm run build -- --outDir E:\release\flowpilot-sdk
```

macOS/Linux:

```bash
npm run build -- --outDir /tmp/flowpilot-sdk
```

PowerShell (Windows):

```powershell
$env:FLOWPILOT_OUT_DIR = "E:\release\flowpilot-sdk"
npm run build
```

CMD (Windows):

```bat
set FLOWPILOT_OUT_DIR=E:\release\flowpilot-sdk
npm run build
```

macOS/Linux:

```bash
FLOWPILOT_OUT_DIR=/tmp/flowpilot-sdk npm run build
```

Minified build (terser, outputs `.min.js`):

```powershell
$env:MINIFY = "true"
npm run build
```

```bat
set MINIFY=true
npm run build
```

```bash
MINIFY=true npm run build
```

Minified build with custom output directory:

```powershell
$env:MINIFY = "true"
$env:FLOWPILOT_OUT_DIR = "E:\release\flowpilot-sdk"
npm run build
```

```bat
set MINIFY=true
set FLOWPILOT_OUT_DIR=E:\release\flowpilot-sdk
npm run build
```

```bash
MINIFY=true FLOWPILOT_OUT_DIR=/tmp/flowpilot-sdk npm run build
```

Script shortcuts (cross-platform):

```bash
npm run build
npm run build:min
npm run build:all
npm run clean
```

Minify + custom output (script shortcut):

```bash
npm run build:min -- --outDir /tmp/flowpilot-sdk
```

Build both (min + non-min) with custom output:

```bash
npm run build:all -- --outDir /tmp/flowpilot-sdk
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
