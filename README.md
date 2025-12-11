# WealthGlow AI / 财富光辉 AI

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Gemini](https://img.shields.io/badge/AI-Gemini%20Pro-orange)

[English](#english) | [中文](#chinese)

---

<a name="english"></a>
## 🇬🇧 English

**WealthGlow AI** is an intelligent investment portfolio simulator and optimizer powered by Google's Gemini 3 Pro model. It helps users visualize their wealth growth over time, plan specifically for withdrawals (FIRE strategy), and receive AI-driven advice on asset allocation.

### ✨ Key Features

*   **Portfolio Simulation**: Visualize asset growth over 5-50 years with customizable expected returns.
*   **Withdrawal Strategy**: Simulate "decumulation" phases with annual/monthly withdrawals and inflation adjustments.
*   **Dual-Axis Visualization**: Compare total portfolio value and annual cash flow on the same chart.
*   **AI Optimization**: Uses **Gemini 3 Pro** to analyze your portfolio risks and suggest improvements based on your financial goals.
*   **Multi-Currency & Language**: Full support for English/USD and Chinese/CNY.
*   **Responsive Design**: A beautiful, mobile-friendly UI built with Tailwind CSS.

### 🛠 Tech Stack

*   **Frontend**: React, TypeScript, Vite
*   **Styling**: Tailwind CSS (via CDN)
*   **Charts**: Recharts
*   **AI Integration**: Google GenAI SDK (`@google/genai`)
*   **Icons**: Lucide React

### 🚀 Getting Started (Local Development)

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/wealthglow-ai.git
    cd wealthglow-ai
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add your Google Gemini API key.
    **Note**: The key name must be exactly `API_KEY`.
    ```env
    API_KEY=your_google_ai_studio_api_key_here
    ```
    *You can get a key from [Google AI Studio](https://aistudiocdn.com/google-ai-studio).*

4.  **Run the development server**
    ```bash
    npm run dev
    ```

### ☁️ Deployment on Vercel (Step-by-Step)

If your previous deployment showed a blank page or crashed, follow these steps exactly.

1.  **Push Code to GitHub**: Make sure `vite.config.ts` and `package.json` are included in your repository.
2.  **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and create a new project.
3.  **Import Repository**: Select your `wealthglow-ai` repo.
4.  **Configure Project**:
    *   **Framework Preset**: Select **Vite**.
    *   **Root Directory**: `./` (Default)
    *   **Build Command**: `vite build` (Default)
    *   **Output Directory**: `dist` (Default)
5.  **⚠️ CRITICAL: Environment Variables**:
    *   Go to the **Environment Variables** section.
    *   Add a variable named **`API_KEY`**.
    *   Paste your Google Gemini API key as the value.
    *   *Why?* The `vite.config.ts` file in this project is specially configured to read this variable during the build process and embed it into the app safely.
6.  **Deploy**: Click **Deploy**.

**Troubleshooting:**
*   **Blank White Page**: Usually means `index.html` is missing `<script type="module" src="/index.tsx"></script>`. We have fixed this in the latest code.
*   **"Process is not defined" Error**: This happens if `vite.config.ts` is missing. Ensure that file exists.

---

<a name="chinese"></a>
## 🇨🇳 中文

**WealthGlow AI (财富光辉 AI)** 是一个由 Google Gemini 3 Pro 模型驱动的智能投资组合模拟器和优化器。它帮助用户可视化财富增长，规划退休提款（FIRE 策略），并获取由 AI 提供的专业资产配置建议。

### ✨ 主要功能

*   **投资组合模拟**：自定义预期回报率，模拟 5-50 年的资产增长趋势。
*   **提款策略模拟**：支持设置年度/月度支出及通胀增长率，模拟资产消耗阶段。
*   **双坐标轴图表**：在同一图表中对比“总资产价值”与“年度提取金额”。
*   **AI 智能优化**：利用 **Gemini 3 Pro** 分析您的投资组合风险，并提供具体的优化建议。
*   **多语言与货币**：完美支持 英文/美元 (USD) 和 中文/人民币 (CNY) 切换。
*   **响应式设计**：基于 Tailwind CSS 构建，适配手机与桌面端。

### 🛠 技术栈

*   **前端框架**: React, TypeScript, Vite
*   **样式库**: Tailwind CSS (CDN 引入)
*   **图表库**: Recharts
*   **AI 集成**: Google GenAI SDK (`@google/genai`)
*   **图标库**: Lucide React

### 🚀 本地开发指南

1.  **克隆代码仓库**
    ```bash
    git clone https://github.com/your-username/wealthglow-ai.git
    cd wealthglow-ai
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **配置环境变量**
    在项目根目录创建一个 `.env` 文件，并添加你的 Google Gemini API 密钥。
    **注意**：变量名必须是 `API_KEY`。
    ```env
    API_KEY=你的_google_ai_studio_api_key
    ```
    *你可以从 [Google AI Studio](https://aistudiocdn.com/google-ai-studio) 免费获取密钥。*

4.  **启动开发服务器**
    ```bash
    npm run dev
    ```

### ☁️ 如何在 Vercel 上发布 (保姆级教程)

如果你之前的发布出现了白屏或报错，请严格按照以下步骤操作。

1.  **上传代码**：确保 `vite.config.ts` 和 `package.json` 已经上传到了 GitHub。
2.  **新建项目**：在 Vercel 控制台点击 "Add New Project"。
3.  **导入仓库**：选择你的 `wealthglow-ai` 仓库。
4.  **项目配置**：
    *   **Framework Preset (框架)**：选择 **Vite**。
    *   **Root Directory**: 保持默认 `./`。
    *   **Build Command**: 保持默认 `vite build`。
    *   **Output Directory**: 保持默认 `dist`。
5.  **⚠️ 关键步骤：配置环境变量**：
    *   找到 **Environment Variables** 区域。
    *   Key (键名) 填写：**`API_KEY`**
    *   Value (值) 填写：你的 Google Gemini API 密钥。
    *   *原理解释*：本项目包含特殊的 `vite.config.ts` 配置，它会在构建（Build）过程中自动读取这个变量并注入到代码中，解决 "process is not defined" 的常见报错。
6.  **点击部署 (Deploy)**。

**常见问题排查：**
*   **打开是白屏？** 通常是因为 `index.html` 里缺了入口脚本。最新的代码中已修复此问题。
*   **报错 "process is not defined"？** 说明 `vite.config.ts` 没有生效或丢失，请检查文件是否存在。

---

MIT License