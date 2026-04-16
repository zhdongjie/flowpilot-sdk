# 构建指南

FlowPilot 使用 Vite library mode 输出 UMD + ESM 包。

## 前置要求

- Node.js 18+
- npm

安装依赖：

```bash
npm install
```

## 构建命令

### 默认构建

```bash
npm run build
```

输出：

- `dist/flowpilot.umd.js`
- `dist/flowpilot.esm.js`

### 压缩构建

```bash
npm run build:min
```

输出：

- `dist/flowpilot.umd.min.js`
- `dist/flowpilot.esm.min.js`

### 同时构建

```bash
npm run build:all
```

### 清理输出

```bash
npm run clean
```

## 自定义输出目录

### 命令行覆盖

```bash
npm run build -- --outDir /tmp/flowpilot-sdk
```

PowerShell 示例：

```powershell
npm run build -- --outDir E:\release\flowpilot-sdk
```

### 环境变量方式

PowerShell：

```powershell
$env:FLOWPILOT_OUT_DIR = "E:\release\flowpilot-sdk"
npm run build
```

Bash：

```bash
FLOWPILOT_OUT_DIR=/tmp/flowpilot-sdk npm run build
```

## 说明

- Vite 中 `emptyOutDir` 被关闭，以便压缩与非压缩产物共存。
- 若需要完全干净目录，请先执行 `npm run clean`。
