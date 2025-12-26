# 梦幻高级工具箱 (MHXY Advanced Toolbox) - 本地部署指南

本项目是一个基于 React 和 TypeScript 构建的梦幻西游综合工具箱，包含召唤兽装备计算、灵饰分析、宝石全景推算及召唤兽属性模拟等功能。

以下是在本地开发环境中部署和运行该项目的详细步骤。

## 前置要求

请确保您的开发环境已安装：
- [Node.js](https://nodejs.org/) (建议版本 18.0.0 或更高)
- npm (Node.js 自带的包管理器)

## 部署步骤

### 1. 初始化项目

我们推荐使用 [Vite](https://vitejs.dev/) 来快速搭建现代化的 React 开发环境。

打开终端（Terminal）或命令行工具，运行以下命令：

```bash
# 创建一个名为 mhxy-toolbox 的新项目，使用 React + TypeScript 模板
npm create vite@latest mhxy-toolbox -- --template react-ts

# 进入项目目录
cd mhxy-toolbox

# 安装基础依赖
npm install
```

### 2. 安装项目依赖

本项目使用了 `lucide-react` 作为图标组件库，需要单独安装：

```bash
npm install lucide-react
```

### 3. 配置 Tailwind CSS

虽然在线版本使用了 CDN，但在本地开发中，推荐安装 Tailwind CSS 以获得最佳性能和开发体验。

**安装依赖:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**配置模板路径:**
打开项目根目录下的 `tailwind.config.js`，将 `content` 数组修改为：

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**添加 Tailwind 指令:**
打开 `src/index.css`，删除原有内容，替换为以下代码：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
```

### 4. 迁移代码

由于原项目是单文件结构，我们需要将其适配到 Vite 的项目结构中。

1.  **替换主入口文件**:
    找到本地项目中的 `src/main.tsx` 文件，将其内容**完全替换**为原项目提供的 `index.tsx` 的代码。
    *(注意：原代码已包含 `createRoot(...).render(...)` 逻辑，因此直接覆盖入口文件即可)*

2.  **更新 HTML 标题**:
    打开 `index.html`，修改 `<title>` 标签：
    ```html
    <title>梦幻高级工具箱 - 召唤兽装备数据中心</title>
    ```

### 5. 启动项目

一切准备就绪，启动开发服务器：

```bash
npm run dev
```

终端将显示访问地址（通常为 `http://localhost:5173/`）。在浏览器中打开该地址，即可看到完整的工具箱界面。

## 构建与发布

如果您需要将项目部署到生产环境（如 Nginx、Vercel 或 GitHub Pages）：

```bash
npm run build
```

构建完成后，`dist` 目录中将生成优化后的静态文件，您可以直接部署该目录的内容。

## 项目结构说明

- **召唤兽属性模拟器**: 包含 110 灵性、元宵/真经、内丹及天赋符的完整算法。
- **召唤兽装备计算器**: 根据成长和属性点反推装备价值。
- **灵饰分析**: 计算灵饰的综合属性点价值。
- **宝石推算**: 计算合成高等级宝石（包括星辉石、五色灵尘等）的成本。
