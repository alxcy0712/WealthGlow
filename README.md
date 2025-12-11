
# WealthGlow AI / 财富光辉 AI

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
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

*   **Frontend**: React 19, TypeScript, Vite
*   **Styling**: Tailwind CSS
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
    Create a `.env` file in the root directory and add your Google Gemini API key:
    ```env
    API_KEY=your_google_ai_studio_api_key_here
    ```
    *You can get a key from [Google AI Studio](https://aistudiocdn.com/google-ai-studio).*

4.  **Run the development server**
    ```bash
    npm run dev
    ```

### ☁️ Deployment on Vercel

This project is optimized for deployment on Vercel. Follow these steps carefully:

#### Option 1: Deploy via Vercel Dashboard (Recommended)

1.  **Push to GitHub**: Ensure your code is pushed to a GitHub repository.
2.  **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and sign in.
3.  **Add New Project**: Click "Add New..." -> "Project".
4.  **Import Repository**: Select your `wealthglow-ai` repository and click "Import".
5.  **Configure Project**:
    *   **Framework Preset**: Vercel usually detects "Vite" automatically. If not, select "Vite".
    *   **Root Directory**: Leave as `./` (unless your code is in a subfolder).
6.  **⚠️ CRITICAL STEP: Environment Variables**:
    *   Expand the **"Environment Variables"** section.
    *   **Key**: `API_KEY`
    *   **Value**: Paste your Google Gemini API Key (starts with `AIza...`).
    *   Click **Add**.
7.  **Deploy**: Click the **"Deploy"** button.
8.  **Wait & Launch**: Wait for the build to complete. Once finished, you will get a live URL (e.g., `https://wealthglow-ai.vercel.app`).

#### Option 2: Deploy via CLI

1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel login`.
3.  Run `vercel` in your project root.
4.  Follow the prompts. When asked "Want to modify these settings?", answer **No** (defaults are usually fine for Vite).
5.  **Set Environment Variable**:
    Go to the Vercel dashboard for your new project, navigate to **Settings > Environment Variables**, and add `API_KEY`.
6.  Trigger a redeploy if the app doesn't work immediately.

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

*   **前端框架**: React 19, TypeScript, Vite
*   **样式库**: Tailwind CSS
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
    在项目根目录创建一个 `.env` 文件，并添加你的 Google Gemini API 密钥：
    ```env
    API_KEY=你的_google_ai_studio_api_key
    ```
    *你可以从 [Google AI Studio](https://aistudiocdn.com/google-ai-studio) 免费获取密钥。*

4.  **启动开发服务器**
    ```bash
    npm run dev
    ```

### ☁️ 如何在 Vercel 上发布 (详细步骤)

本项目非常适合部署在 Vercel 上。请按照以下步骤操作：

#### 方法 1：通过 Vercel 网页控制台部署 (推荐)

1.  **上传代码到 GitHub**：确保你的代码已经提交并推送到 GitHub 仓库中。
2.  **登录 Vercel**：访问 [vercel.com](https://vercel.com) 并使用 GitHub 账号登录。
3.  **新建项目**：点击控制台右上角的 "Add New..." -> "Project"。
4.  **导入仓库**：在列表中找到你的 `wealthglow-ai` 仓库，点击 "Import" 按钮。
5.  **配置项目**：
    *   **Framework Preset (框架预设)**：Vercel 通常会自动检测为 "Vite"。如果没有，请手动选择。
    *   **Root Directory (根目录)**：保持默认 `./` 即可。
6.  **⚠️ 关键步骤：配置环境变量 (Environment Variables)**：
    *   展开 **"Environment Variables"** 选项卡。
    *   **Key (键)**: 输入 `API_KEY`
    *   **Value (值)**: 粘贴你的 Google Gemini API 密钥 (以 `AIza` 开头)。
    *   点击 **Add** 按钮保存。
    *   *注意：如果不配置这个，AI 优化功能将无法在以后的线上版本中使用。*
7.  **点击部署 (Deploy)**：点击蓝色的 **"Deploy"** 按钮。
8.  **完成**：等待几十秒构建完成。屏幕上会出现满屏庆祝动画，你可以点击预览图访问你的在线应用（例如 `https://wealthglow-ai.vercel.app`）。

#### 方法 2：常见问题排查

*   **构建失败？** 确保你的 `package.json` 中包含 `build` 脚本 (通常是 `vite build`)。
*   **AI 功能报错？** 请检查 Vercel 后台的 Environment Variables 中是否正确填写了 `API_KEY`，并且密钥本身是有效的。修改环境变量后，通常需要去 "Deployments" 页面重新 Redeploy 一次才能生效。

---

MIT License
