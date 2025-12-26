# 梦幻高级工具箱 (MHXY Advanced Toolbox) - 本地部署指南

本项目是一个基于 React 和 TypeScript 构建的梦幻西游综合工具箱，包含召唤兽装备计算、灵饰分析、宝石全景推算及召唤兽属性模拟等功能。

以下是在本地开发环境中部署和运行该项目的详细步骤。

## 常见问题排查

**Q: 执行 `npx tailwindcss init -p` 报错 "could not determine executable to run"？**
A: 这是因为 npm 默认安装了 Tailwind CSS v4，而 v4 的命令行工具已变更。请参考下方的 **"步骤 3"**，我们已更新命令以强制安装 `tailwindcss@3` 版本。

**Q: 启动后页面显示 "Vite + React" 和一个计数器，而不是工具箱？**
A: 这是因为您没有替换正确的入口文件。Vite 项目默认加载 `src/main.tsx`。请务必执行下方的 **"步骤 4.1：替换核心逻辑"**，将生成的 `index.tsx` 代码完整覆盖到本地的 `src/main.tsx` 文件中。

---

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

### 3. 配置 Tailwind CSS (关键修正)

为了兼容本项目的配置方式，我们需要安装 Tailwind CSS v3 版本。

**3.1 安装依赖:**

请运行以下命令（**注意 `@3`**，这将覆盖您之前安装的 v4 版本）：

```bash
npm install -D tailwindcss@3 postcss autoprefixer
```

**3.2 初始化配置:**

```bash
npx tailwindcss init -p
```

*如果上述命令仍然报错，您可以跳过此命令，手动在项目根目录创建以下两个文件：*

1.  创建 `postcss.config.js`，内容如下：
    ```javascript
    export default {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    }
    ```
2.  创建 `tailwind.config.js`，内容见下一步。

**3.3 配置模板路径:**
打开（或创建）项目根目录下的 `tailwind.config.js`，将内容修改为：

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

**3.4 添加 Tailwind 指令:**
找到 `src/index.css` 文件，**删除所有原有内容**，替换为以下代码：

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

### 4. 迁移核心代码 (关键步骤)

请严格按照以下文件名对应关系进行代码复制：

**4.1 替换核心逻辑 (`src/main.tsx`):**
*   **源文件**: 本页面提供的 `index.tsx` 代码。
*   **目标文件**: 本地项目中的 `src/main.tsx`。
*   **操作**: 打开本地的 `src/main.tsx`，**清空所有内容**，然后将本页面 `index.tsx` 的全部代码粘贴进去。
    *   *解释：原代码中已经包含了 `createRoot(...).render(...)` 的启动逻辑，所以直接替换 `main.tsx` 即可生效。替换后，原有的 `src/App.tsx` 将不再被使用，您可以将其删除。*

**4.2 更新 HTML 标题 (`index.html`):**
*   打开项目根目录下的 `index.html`。
*   修改 `<title>` 标签内容为：
    ```html
    <title>梦幻高级工具箱 - 召唤兽装备数据中心</title>
    ```

### 5. 启动项目

完成上述步骤后，在终端运行：

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
