# 梦幻高级工具箱 (MHXY Advanced Toolbox) - 本地部署指南

本项目是一个基于 React 和 TypeScript 构建的梦幻西游综合工具箱，包含召唤兽装备计算、灵饰分析、宝石全景推算及召唤兽属性模拟等功能。

以下是在本地开发环境中部署和运行该项目的详细步骤。

## 常见问题排查

**Q: 报错 `[plugin:vite:import-analysis] Failed to resolve import ...`?**
A: 这是因为项目采用了模块化结构。**您必须在本地的 `src` 目录下手动创建对应的文件夹和文件**。请严格按照下文 **"步骤 4"** 的目录结构进行操作。例如，`Dashboard.tsx` 必须放在 `src/features/` 文件夹内。

**Q: 启动后页面样式全丢了 (Styles missing)？**
A: 请确保 `src/main.tsx` (即替换后的入口文件) 顶部包含 `import './index.css';`。

**Q: 执行 `npx tailwindcss init -p` 报错 "could not determine executable to run"？**
A: 请参考下方的 **"步骤 3"**，确保安装的是 `tailwindcss@3` 版本。

---

## 部署步骤

### 1. 初始化项目

我们推荐使用 [Vite](https://vitejs.dev/) 来快速搭建现代化的 React 开发环境。

打开终端（Terminal），运行以下命令：

```bash
# 创建项目
npm create vite@latest mhxy-toolbox -- --template react-ts

# 进入目录
cd mhxy-toolbox

# 安装依赖
npm install
```

### 2. 安装额外依赖

```bash
npm install lucide-react
```

### 3. 配置 Tailwind CSS

**3.1 安装 v3 版本:**

```bash
npm install -D tailwindcss@3 postcss autoprefixer
```

**3.2 初始化:**

```bash
npx tailwindcss init -p
```

**3.3 修改 `tailwind.config.js`:**

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

**3.4 修改 `src/index.css`:**
清空原内容，填入：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
```

### 4. 迁移核心代码 (关键步骤 - 请仔细阅读)

由于代码已拆分，请在您的 **`src`** 目录下按照以下结构创建文件。

**4.1 创建文件夹**
在 `src` 目录下创建两个新文件夹：
*   `src/features`
*   `src/components`

**4.2 创建通用文件**
在 `src` 根目录下创建以下文件，并将本页面提供的对应代码粘贴进去：
*   `src/types.ts`
*   `src/constants.ts`
*   `src/utils.ts`

**4.3 创建组件文件**
将对应的代码粘贴到新建的文件中：
*   `src/components/Shared.tsx`

**4.4 创建功能模块文件**
将对应的代码粘贴到 `src/features/` 文件夹下的文件中：
*   `src/features/Dashboard.tsx`
*   `src/features/SummonedBeastSim.tsx`
*   `src/features/SummonedBeastEquipCalculator.tsx`
*   `src/features/SpiritAccessoryCalculator.tsx`
*   `src/features/GemPriceCalculator.tsx`

**4.5 替换入口文件**
*   **源文件**: 本页面提供的 `index.tsx` 代码。
*   **目标文件**: 本地项目中的 `src/main.tsx`。
*   **操作**: 清空本地 `src/main.tsx` 的内容，将 `index.tsx` 的代码完整粘贴进去。

> **最终目录结构应如下所示：**
> ```
> src/
> ├── components/
> │   └── Shared.tsx
> ├── features/
> │   ├── Dashboard.tsx
> │   ├── GemPriceCalculator.tsx
> │   ├── SpiritAccessoryCalculator.tsx
> │   ├── SummonedBeastEquipCalculator.tsx
> │   └── SummonedBeastSim.tsx
> ├── constants.ts
> ├── index.css
> ├── main.tsx  (代码来自 index.tsx)
> ├── types.ts
> ├── utils.ts
> └── vite-env.d.ts
> ```

### 5. 启动项目

```bash
npm run dev
```
