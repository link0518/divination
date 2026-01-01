# ☯️ AI 算卦 (AI Divination)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsunls24%2Fdivination&env=OPENAI_API_KEY)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个结合传统周易**六爻**起卦原理与现代 **AI** 大模型技术的智能占卜应用。通过模拟真实的铜钱起卦流程，配合干支历法进行准确排盘，并利用 AI 对卦象进行深入解读。

![screenshots](./docs/screenshots.jpg)

## ✨ 特性 (Features)

- 🪙 **拟真起卦**：真实的六次铜钱摇卦模拟，体验传统仪式感。
- 🔮 **AI 解卦**：集成 OpenAI/兼容接口，智能分析卦辞、爻辞与变卦。
- 📅 **专业排盘**：内置 `lunar-javascript`，精准计算干支、六兽、伏神、世应等专业信息。
- 💾 **历史记录**：本地保存占卜记录，随时回顾过往卦象。
- 🌗 **六爻正宗**：严格遵循传统六爻起卦与排盘逻辑。
- 🎨 **现代 UI**：基于 Shadcn UI + Tailwind CSS 打造的简洁美观界面。

## 🛠️ 技术栈 (Tech Stack)

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) / [Radix UI](https://www.radix-ui.com/)
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/docs)
- **Calendar Logic**: [lunar-javascript](https://github.com/6tail/lunar-javascript)

## ⚙️ 环境变量 (Environment Variables)

在项目根目录创建 `.env.local` 文件并配置以下变量：

```env
# OpenAI API Key (必填)
OPENAI_API_KEY=sk-xxxxxx

# API Base URL (可选，默认 https://api.openai.com/v1)
# 如果使用中转服务或其它兼容 OpenAI 协议的模型(如 DeepSeek, Moonshot 等)，请在此修改
OPENAI_BASE_URL=https://api.openai.com/v1

# Model Name (可选，默认 gpt-3.5-turbo)
OPENAI_MODEL=gpt-3.5-turbo
```

## 🚀 本地运行 (Getting Started)

1. **克隆仓库**

```bash
git clone https://github.com/sunls24/divination.git
cd divination
```

2. **安装依赖**

```bash
pnpm install
```

3. **运行开发服务器**

```bash
pnpm dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可开始使用。

## 🤝 贡献 (Contributing)

欢迎提交 Issue 或 Pull Request 来改进这个项目！

## 📄 许可证 (License)

本项目采用 [MIT](./LICENSE) 许可证。
