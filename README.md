# SpeakFlow — AI 语音输入工具

> **[🌐 在线体验](https://shiyue105.github.io/Speakflow/)** | [📺 交互式 Demo](https://shiyue105.github.io/Speakflow/demo.html) | [📦 GitHub 仓库](https://github.com/shiyue105/Speakflow)

## 项目简介

SpeakFlow 是一款基于浏览器原生 Web Speech API 构建的语音输入法产品。面向课堂笔记、会议纪要、聊天短句、学术写作草稿等场景，帮助用户通过语音快速完成文本输入与轻量编辑，在准确度、易用性、响应速度和成本之间取得平衡。

## 目标用户

| 用户类型 | 场景 | 痛点 |
|---------|------|------|
| 学生 | 课堂笔记、论文草稿 | 打字速度跟不上思考节奏 |
| 办公用户 | 会议纪要、日报周报 | 手动记录容易遗漏内容 |
| 内容创作者 | 灵感记录、短文案 | 键盘输入打断表达节奏 |

## 核心功能

| 模块 | 功能 | 状态 |
|------|------|------|
| 语音识别 | 基于 Web Speech API 持续聆听，区分 interim 临时结果与 final 确认结果 | ✅ |
| 多语言 | 中文普通话、English (US)、日本語、한국어、粤语 | ✅ |
| 自动标点 | 识别「逗号/句号/问号/感叹号/顿号/冒号/分号」七种口述标点并转换为符号 | ✅ |
| 语音命令 | 支持「换行」「删除上一句」「复制全文」「清空文本」四种语音编辑命令 | ✅ |
| 场景模式 | 课堂笔记 / 聊天短句 / 学术写作三种文本后处理策略 | ✅ |
| 文本编辑 | 识别结果写入可编辑 textarea，支持随时手动修正 | ✅ |
| 实时统计 | 字符数、句子数、识别片段数、响应延迟（ms） | ✅ |
| 操作日志 | 带时间戳的操作日志，按时间倒序展示，最多保留 30 条 | ✅ |
| 导出 | 一键复制到剪贴板 + 下载 TXT 文件 | ✅ |
| 快捷键 | `Esc` 快速停止录音 | ✅ |
| 错误处理 | 覆盖 no-speech、audio-capture、not-allowed、network、aborted 等 8 种异常 | ✅ |
| 自动恢复 | 识别意外中断时自动重连 | ✅ |
| 响应式 | 适配桌面端（960px）、平板（800px）、手机（480px） | ✅ |

## 技术架构

本项目采用纯原生 Web 技术实现，**无任何 npm 依赖，未引入第三方前端框架或库**。架构层次如下：

```
index.html → style.css → script.js (IIFE)
                │
        ┌───────┴────────┐
        │  CSS 变量设计系统  │
        │  响应式三断点      │
        └────────────────┘

script.js 内部模块分层：

┌─────────────────────────────┐
│  1. DOM 元素绑定层            │  bindElements()
├─────────────────────────────┤
│  2. 兼容性检测层              │  isSupported()
├─────────────────────────────┤
│  3. 语音识别引擎层            │  createRecognizer()
│     - continuous: true       │
│     - interimResults: true   │
│     - maxAlternatives: 1     │
├─────────────────────────────┤
│  4. 文本后处理层              │  processText()
│     ├─ applyPunctuation()    │  口述标点 → 符号替换
│     └─ handleVoiceCommand()  │  语音命令匹配与执行
├─────────────────────────────┤
│  5. UI 状态管理层             │  updateUIState()
│     - recording / idle 切换   │
├─────────────────────────────┤
│  6. 指标统计层                │  updateMetrics()
│     - 字符数、句子数实时计算    │
├─────────────────────────────┤
│  7. 剪贴板操作层              │  copyText()
│     - navigator.clipboard    │
│     - document.execCommand   │
│       ('copy') fallback      │
├─────────────────────────────┤
│  8. 文件导出层                │  downloadText()
│     - Blob + URL.createObjectURL│
├─────────────────────────────┤
│  9. 操作日志层                │  addLog()
│     - 时间戳 + 消息格式        │
│     - 最多 30 条滚动缓存       │
└─────────────────────────────┘
```

### 数据流

```
用户语音
  ↓
Web Speech API (浏览器内置)
  ↓
interim 临时结果 → 显示在 interim-bar
  ↓
final 确定结果 → processText()
  ├─ applyPunctuation() → 口述标点替换
  ├─ handleVoiceCommand() → 匹配语音命令
  └─ 写入 textarea editor
  ↓
updateMetrics() → 更新统计卡片
addLog() → 写入日志列表
```

## 技术选型依据

| 选型 | 方案 | 理由 |
|------|------|------|
| 前端框架 | 无框架（原生 HTML/CSS/JS） | 零安装、零构建、评委可直接打开运行 |
| 语音识别 | Web Speech API | 浏览器内置，零成本，低延迟，W3C 标准 |
| CSS 方案 | CSS 变量 + 原生选择器 | 无需构建工具，维护设计系统清晰 |
| 代码组织 | IIFE 模块化 | 避免全局污染，函数职责清晰 |
| 部署方式 | 静态 HTML 页面 | 支持 GitHub Pages，无需服务器 |

## 原创功能说明

以下为核心原创实现，未引用任何第三方代码：

| 原创模块 | 实现文件 | 说明 |
|---------|---------|------|
| 语音命令系统 | script.js L241-L266 | 基于正则匹配的语音命令引擎，支持 4 种编辑操作 |
| 自动标点引擎 | script.js L217-L239 | 7 种中英文口述标点到符号的双向转换 |
| 场景化后处理 | script.js L227-L236 | 根据 note/chat/academic 模式自动添加句末标点 |
| 实时指标统计 | script.js L431-L438 | 字符数（去空格）、句子数（按标点+换行分割）实时计算 |
| 操作日志系统 | script.js L446-L460 | 带时间戳的滚动日志，自动裁剪至 30 条 |
| 剪贴板双通道方案 | script.js L341-L380 | 优先 navigator.clipboard，自动降级 execCommand |
| 识别中断自动恢复 | script.js L181-L192 | onend 检测 isListening 状态自动 restart |
| CSS 设计系统 | style.css L9-L40 | 30+ CSS 变量，支持一键换肤扩展 |
| 脉冲动画指示器 | style.css L518-L526 | 纯 CSS 动画的录音状态可视化指示 |

## 第三方依赖

| 依赖 | 类型 | 来源 | 说明 |
|------|------|------|------|
| Web Speech API | 浏览器内置 API | W3C 标准，Chrome/Edge 内置 | 语音识别核心能力 |
| 无 | 无 | 无 | 本项目不依赖任何 npm 包、CDN 资源或第三方 JS 库 |

## 项目结构

```
SpeakFlow/
├── .gitignore                  Git 忽略配置
├── index.html                   主页面（187 行）
├── demo.html                    交互式功能演示页
├── style.css                    样式系统（786 行，CSS 变量 + 响应式）
├── script.js                    核心引擎（518 行，IIFE 模块化）
├── README.md                    项目文档（本文件）
├── CONTRIBUTING.md              贡献与 PR 规范指南
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md  PR 提交模板
└── Speakflow/
    ├── docs/
    │   ├── user-research.md     用户需求分析
    │   ├── pr-plan.md           PR 与 commit 规划
    │   ├── test-plan.md         测试计划
    │   └── demo-script.md       Demo 视频脚本
    └── src/                     早期原型代码（参考）
```

## 测试方式

详细的测试用例见 [Speakflow/docs/test-plan.md](Speakflow/docs/test-plan.md)。以下是快速验证流程：

### 环境准备

- 浏览器：Google Chrome 或 Microsoft Edge（需支持 Web Speech API）
- 设备：带麦克风的电脑或手机
- 网络：需联网（Web Speech API 依赖云端识别服务）

### 功能测试步骤

| 步骤 | 操作 | 预期结果 |
|------|------|---------|
| 1 | 用 Chrome 打开 index.html | 页面显示「可用」徽章，状态为「未开始」 |
| 2 | 点击「开始语音输入」 | 浏览器弹出麦克风权限请求 |
| 3 | 授权麦克风后说「今天天气真好句号」 | 编辑区出现「今天天气真好。」（句号已转换） |
| 4 | 说「换行」 | 编辑区插入换行符 |
| 5 | 切换语言为 English，说 "hello world period" | 编辑区出现英文文本 |
| 6 | 勾选「自动标点」，说「逗号测试逗号」 | 出现「，测试，」 |
| 7 | 说「删除上一句」 | 最后一句文本被删除 |
| 8 | 说「清空文本」 | 编辑区清空 |
| 9 | 手动输入文本后点击「复制」 | 剪贴板包含文本，按钮显示「已复制」 |
| 10 | 手动输入文本后点击「下载 TXT」 | 浏览器下载 .txt 文件 |
| 11 | 按 `Esc` 键 | 录音停止 |
| 12 | 点击「清除日志」 | 日志列表清空 |

### 异常测试

| 场景 | 操作 | 预期结果 |
|------|------|---------|
| 浏览器不支持 | 用 Firefox 打开 | 显示「不可用」，按钮禁用 |
| 拒绝麦克风 | 弹窗点「拒绝」 | 日志显示「麦克风权限被拒绝」 |
| 静默输入 | 开始后不说话 | 页面保持运行，不崩溃 |
| 频繁启停 | 快速点击开始/停止 | 无重复启动异常 |

## 运行方式

```bash
# 方式一：直接打开（推荐）
start index.html

# 方式二：本地静态服务
python -m http.server 8080
# 访问 http://localhost:8080
```

## Demo

在线交互式功能演示（自动播放，含键盘控制）：

👉 **[打开 Demo 演示页](demo.html)**

Demo 页支持：
- 自动播放 10 步完整功能演示
- 键盘控制：`空格` 播放/暂停、`← →` 切换步骤
- 三档播放速度：1x / 2x / 4x
- 模拟真实语音输入与状态切换效果

访问 http://localhost:8080/demo.html 查看演示视频

Bilibili视频链接 [https://member.bilibili.com/platform/upload-manager/archive-process?bvid=BV1apGJ6GEkf](https://www.bilibili.com/video/BV1apGJ6GEkf/?spm_id_from=333.1387.homepage.video_card.click&vd_source=22d457e89b91f98294d2307489d08b44)


## 开源许可

MIT License
