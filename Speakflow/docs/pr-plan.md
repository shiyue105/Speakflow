# PR 与 Commit 规划

> 评审要求持续 PR 和 commit，每个 PR 只做一件事，合并后主分支保持可运行。

## 实际 PR 拆分记录

### PR 1：初始化项目结构与基础页面布局

**标题**：`feat: initialize SpeakFlow project with landing page and editor panel`

**功能描述**：搭建项目基础骨架，包含语义化 HTML5 页面结构、CSS 变量设计系统、响应式三断点布局。

**实现思路**：使用纯原生 HTML/CSS 搭建单页面应用，CSS 采用 `:root` 变量定义 30+ 设计令牌（颜色、阴影、圆角、过渡），布局使用 CSS Grid + Flexbox 混合方案。

**测试方式**：直接用 Chrome 打开 index.html，确认页面结构完整、各区域布局正确、无 JS 报错。

**建议 commit**：
```
chore: initialize project structure and .gitignore
feat: add semantic HTML landing page with editor panel
feat: implement CSS design system with 30+ variable tokens
feat: add responsive breakpoints (960px / 800px / 480px)
```

---

### PR 2：接入浏览器语音识别引擎

**标题**：`feat: integrate browser Web Speech API with continuous recognition`

**功能描述**：实现语音识别的完整生命周期管理——初始化、开始、实时展示 interim 结果、确认 final 结果、停止、异常处理、自动恢复。

**实现思路**：封装 `createRecognizer()` 工厂函数配置 `SpeechRecognition` 实例（continuous: true, interimResults: true, maxAlternatives: 1）。通过 `onresult` 事件区分 `isFinal` 属性分流 interim 和 final 结果到不同 UI 区域。`onerror` 覆盖 8 种错误类型并映射中文提示。`onend` 自动检测 `isListening` 状态决定是否重连。

**测试方式**：Chrome 中授权麦克风后朗读中文句子，观察 interim-bar 实时更新、编辑区接收 final 文本。模拟断网、拒绝权限、频繁启停等异常场景验证错误处理。

**建议 commit**：
```
feat: add speech recognition engine with createRecognizer
feat: implement interim/final result dual-channel display
feat: add comprehensive error handling for 8 error types
feat: implement auto-reconnect on unexpected onend
fix: handle unsupported browser detection and graceful degradation
```

---

### PR 3：实现自动标点与语音命令系统

**标题**：`feat: implement auto-punctuation engine and voice command matcher`

**功能描述**：实现 7 种口述标点到符号的自动转换，以及 4 种语音编辑命令的识别与执行。

**实现思路**：
- 自动标点：`applyPunctuation()` 使用链式 `String.replace()` 将口述标点关键词（逗号→逗号，句号→。等）转换为对应 Unicode 符号。根据场景模式（note/chat/academic）自动追加句末标点。
- 语音命令：`handleVoiceCommand()` 先将文本去标点归一化，然后精确匹配「换行」「删除上一句」「复制全文」「清空文本」四个命令关键词，匹配成功后执行对应操作并返回 true 阻断文本追加。

**测试方式**：逐条朗读标点命令和编辑命令，验证：
- 「逗号」→「，」，「句号」→「。」等 7 种转换
- 「换行」→ 插入 `\n`
- 「删除上一句」→ 删除最后一句
- 「复制全文」→ 剪贴板包含全文
- 「清空文本」→ 编辑区清空
- 关闭语音命令开关后命令词作为普通文本输入

**建议 commit**：
```
feat: add 7-type punctuation post-processing engine
feat: implement voice command keyword matching and execution
feat: add scene-mode-based sentence-ending logic
```

---

### PR 4：增加统计指标、操作日志与文件导出

**标题**：`feat: add real-time metrics, operation logs, and TXT export`

**功能描述**：实现字符数/句子数/识别片段/响应延迟四维统计、带时间戳的操作日志、一键下载 TXT 文件。

**实现思路**：
- 统计：`updateMetrics()` 监听 editor input 事件实时计算——字符数用正则去空格，句子数按 `。！？.!?\n` 分割
- 日志：`addLog()` 用 `Date.toLocaleTimeString` 生成时间戳，`insertBefore` 实现倒序插入，`while > 30` 自动裁剪
- 导出：`downloadText()` 用 `Blob + URL.createObjectURL` 生成下载链接，文件名含日期时间

**测试方式**：
- 输入多段文本验证统计实时变化
- 清空后验证统计归零
- 多次操作后验证日志倒序且上限 30 条
- 点击下载验证文件名格式和文件内容

**建议 commit**：
```
feat: add real-time metrics (char/sentence/session/latency)
feat: implement timestamped operation log with 30-entry cap
feat: support TXT file download via Blob API
```

---

### PR 5：实现剪贴板双通道方案与 UI 完善

**标题**：`feat: implement clipboard dual-path with fallback and toast feedback`

**功能描述**：实现剪贴板复制功能的现代 API + 传统 execCommand 双通道方案，添加 toast 通知、按钮状态动画、键盘快捷键。

**实现思路**：
- 剪贴板：`copyText()` 优先尝试 `navigator.clipboard.writeText()`，失败或不可用时降级为 `document.execCommand('copy')` + 临时 textarea 方案
- Toast：CSS transition + setTimeout 实现 2 秒自动消失的浮动通知
- 按钮反馈：复制成功后临时替换按钮内容为勾号图标 +「已复制」文字
- 快捷键：全局 keydown 监听 Esc 键停止录音

**测试方式**：
- Chrome 中测试 clipboard API 通道
- 模拟旧浏览器环境测试 execCommand fallback
- 验证 toast 出现、消失动画
- 验证复制按钮绿色状态变换和恢复

**建议 commit**：
```
feat: implement clipboard copy with modern API and execCommand fallback
feat: add toast notification system with CSS transition
feat: implement copy button success state animation
feat: add Esc keyboard shortcut for stopping recognition
```

---

### PR 6：完善多语言支持与场景模式切换

**标题**：`feat: add 5-language support and scene mode selector`

**功能描述**：支持中文普通话、English、日本語、한국어、粤语五种语言的语音识别切换，以及课堂笔记/聊天短句/学术写作三种场景模式。

**实现思路**：
- 语言切换：`languageSelect.onchange` 中检测当前是否识别中，若是则先停止再重建 `SpeechRecognition` 实例传入新 `lang` 值
- 场景模式：`modeSelect.value` 影响 `applyPunctuation()` 的句末标点追加策略

**测试方式**：切换每种语言后朗读对应语言文本，验证识别正确。切换场景模式后验证句末标点追加逻辑。

**建议 commit**：
```
feat: add 5-language selector with hot-switch support
feat: implement 3-mode scene selector for punctuation strategy
```

---

### PR 7：完善文档与项目规范

**标题**：`docs: add comprehensive README, test plan, PR template, and contribution guide`

**功能描述**：完善 README（依赖声明、原创功能、技术架构、测试步骤）、测试计划（50+ 用例）、PR 模板、贡献指南、demo 视频脚本。

**实现思路**：按评审规范要求组织文档结构，确保依赖声明明确、原创代码标注清晰、测试步骤可复现。

**测试方式**：根据 README 的测试步骤从零运行项目，逐条验证功能与预期一致。

**建议 commit**：
```
docs: rewrite README with dependency declaration and original code annotation
docs: update test plan with 50+ comprehensive test cases
docs: create PR template with title/description/implementation/test sections
docs: add CONTRIBUTING.md with PR granularity guidelines
docs: update demo script to match delivered features
```

---

## PR 提交规范

每个 PR 描述必须包含：

```
## 标题
一句话说明本 PR 新增或修改了什么。

## 功能描述
说明该功能的具体作用、应用场景及使用方式。

## 实现思路
阐述功能实现的技术选型依据、核心算法或关键实现逻辑。

## 测试方式
说明如何验证该功能的正常运行，包括测试步骤、预期结果及验证方法。

## 备注
如复用了旧代码或参考了第三方资料，需在此明确注明来源。
```