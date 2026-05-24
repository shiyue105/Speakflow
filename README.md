# SpeakFlow — AI 语音输入工具

## 项目介绍

SpeakFlow 是一款基于 Web 技术的 AI 语音输入工具，通过浏览器原生 Web Speech API 实现语音到文字的实时转换。产品面向学生笔记、办公会议、内容创作等场景，帮助用户提高文本输入效率。

**设计理念**：在准确度、易用性、响应速度和成本之间取得平衡 — 零第三方依赖，数据仅在浏览器本地处理。

## 功能列表

| 功能 | 描述 | 状态 |
|------|------|------|
| 语音转文字 | 基于 Web Speech API 实现实时语音识别 | ✅ |
| 持续识别 | `continuous: true` 持续聆听，无需反复点击 | ✅ |
| 实时反馈 | 区分「已确认结果」和「临时识别结果」双通道显示 | ✅ |
| 多语言支持 | 中文普通话、English、日本語、한국어、粤语 | ✅ |
| 自动标点 | 语音说出「逗号」「句号」等自动转换为标点符号 | ✅ |
| 语音命令 | 支持「换行」「删除上一句」「复制全文」「清空文本」 | ✅ |
| 应用场景 | 课堂笔记 / 聊天短句 / 学术写作三种模式 | ✅ |
| 文本编辑 | 识别结果写入可编辑文本框，支持手动修正 | ✅ |
| 复制导出 | 一键复制到剪贴板 + 下载 TXT 文件 | ✅ |
| 实时统计 | 字符数、句子数、识别片段数、响应延迟 | ✅ |
| 识别日志 | 完整操作日志，支持清除 | ✅ |
| 响应式设计 | 适配桌面端与移动端 | ✅ |
| 快捷键 | `Esc` 快速停止录音 | ✅ |
| 错误处理 | 覆盖无语音、麦克风权限、网络错误等所有异常场景 | ✅ |
| 自动恢复 | 识别意外中断时自动重连 | ✅ |

## 安装与使用

### 环境要求

- 现代浏览器（推荐 Chrome 或 Edge，需支持 Web Speech API）
- 麦克风设备
- **无需安装任何依赖**

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/shiyue105/Speakflow.git
cd Speakflow

# 直接浏览器打开
start index.html

# 或通过本地服务器运行
python -m http.server 8080
# 访问 http://localhost:8080
```

### 使用流程

1. 浏览器打开 `index.html`
2. 点击「开始语音输入」按钮
3. 浏览器弹出麦克风权限请求 → 点击「允许」
4. 开始说话，识别结果实时显示
5. 可以使用语音命令控制（需开启「语音命令」开关）
6. 点击「停止」或按 `Esc` 结束录音
7. 点击「复制」或「下载 TXT」导出文本

### 语音命令

当「语音命令」开关开启时，可以说出以下命令：

| 说出 | 效果 |
|------|------|
| 换行 | 插入换行符 |
| 删除上一句 | 删除文本最后一句 |
| 复制全文 | 复制全部文本到剪贴板 |
| 清空文本 | 清空输入区 |

## 技术架构

```
SpeakFlow/
├── index.html      # 主页面（语义化 HTML5 结构）
├── style.css       # 样式系统（CSS 变量 + 响应式布局）
├── script.js       # 核心引擎（IIFE 模块化封装）
└── README.md       # 项目文档
```

### 核心模块

```
script.js (IIFE)
├── 元素绑定层    → bindElements() 统一管理 DOM 引用
├── 兼容检测层    → isSupported() 检测 Web Speech API 可用性
├── 识别引擎层    → createRecognizer() 配置 continuous + interimResults
├── 文本处理层    → processText() → applyPunctuation() + handleVoiceCommand()
├── 状态管理层    → updateUIState() 控制 UI 状态切换
├── 指标统计层    → updateMetrics() 实时计算字符数/句子数
├── 剪贴板层      → copyText() 现代 API + fallback 兼容
├── 导出层        → downloadText() Blob + URL.createObjectURL
├── 日志层        → addLog() 带时间戳的操作日志
└── 事件注册层    → registerEvents() 统一管理用户交互
```

### 技术栈

| 技术 | 用途 | 说明 |
|------|------|------|
| HTML5 | 页面结构 | 语义化标签，WAI-ARIA 无障碍 |
| CSS3 | 样式与动画 | CSS 变量设计系统，无框架 |
| JavaScript (ES5+) | 核心逻辑 | 原生 JS，零第三方依赖 |
| Web Speech API | 语音识别 | 浏览器内置，W3C 标准 |

**零第三方依赖** — 纯原生 Web 技术实现。

## 浏览器兼容性

| 浏览器 | 支持状态 | 备注 |
|--------|----------|------|
| Google Chrome | ✅ 完全支持 | 推荐 |
| Microsoft Edge | ✅ 完全支持 | 推荐 |
| Safari | ⚠️ 部分支持 | 需 HTTPS |
| Firefox | ❌ 不支持 | 无 Web Speech API |

## 设计决策

### 准确度 vs 成本

选择浏览器内置 Web Speech API 而非云端付费 API：
- **成本**：¥0，无需支付 API 调用费用
- **延迟**：本地处理，响应更快
- **隐私**：数据不离开浏览器
- **准确度**：Chrome 的中文识别准确度在日常场景可达 90%+

### 易用性设计

- 一键开始/停止，降低操作门槛
- 语音命令减少键鼠切换
- 识别结果可编辑，容错设计
- 实时状态反馈（视觉 + 文字）

### 响应速度优化

- `maxAlternatives: 1` 减少计算开销
- 文本自动滚动到底部
- 临时识别结果独立渲染，不阻塞 UI

## Demo 视频

> 视频链接：[待上传]

## 许可证

MIT License

---

Built with ❤️ using pure HTML, CSS & JavaScript.