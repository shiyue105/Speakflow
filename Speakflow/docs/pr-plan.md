# PR 与 Commit 规划

> 注意：评审要求持续 PR 和 commit。不要最后一天一次性提交全部代码。下面是建议的开发节奏。每个 PR 只做一件事，合并后主分支保持可运行。

## 建议 PR 拆分

### PR 1：初始化项目结构与基础页面

- 功能描述：创建首页结构、基本布局和 README 初稿。
- 实现思路：使用原生 HTML/CSS 搭建静态页面。
- 测试方式：本地打开 index.html，确认页面正常显示。

建议 commit：

```text
chore: initialize speakflow project structure
feat: add landing layout and editor panel
```

### PR 2：接入浏览器语音识别

- 功能描述：实现开始、停止、实时识别结果展示。
- 实现思路：封装 Web Speech API 的初始化、onstart、onresult、onend 逻辑。
- 测试方式：Chrome/Edge 中授权麦克风并朗读中文句子。

建议 commit：

```text
feat: integrate browser speech recognition
fix: handle unsupported browser status
```

### PR 3：实现自动标点与语音命令

- 功能描述：支持句号、逗号、问号、换行、删除上一句、复制全文、清空文本。
- 实现思路：在 final transcript 后执行文本后处理和命令匹配。
- 测试方式：逐条朗读命令并确认编辑区变化正确。

建议 commit：

```text
feat: add punctuation post-processing
feat: add voice command actions
```

### PR 4：增加统计、日志与导出

- 功能描述：增加字符数、句子数、识别片段、响应延迟、日志、下载 TXT。
- 实现思路：监听输入区变化并更新统计；使用 Blob 导出文本。
- 测试方式：输入多段文本，确认统计变化和文件下载正常。

建议 commit：

```text
feat: add input metrics and recognition logs
feat: support txt export
```

### PR 5：完善文档与演示材料

- 功能描述：补充 README、测试计划、用户需求分析、demo 视频脚本。
- 实现思路：按评审规则补齐提交材料。
- 测试方式：根据 README 从零运行项目，检查 demo 脚本覆盖核心功能。

建议 commit：

```text
docs: add user research and test plan
 docs: add demo script and submission checklist
```

## PR 模板建议

每个 PR 描述必须包含：

```text
## 标题
一句话说明本 PR 新增或修改了什么。

## 功能描述
说明该功能的作用与使用方式。

## 实现思路
说明技术选型或核心实现逻辑。

## 测试方式
说明如何验证该功能正常运行。

## 备注
如复用了旧代码或参考了第三方资料，需要在这里注明。
```

## 提交注意事项

1. 仓库应在开题后创建。
2. commit 时间戳必须在比赛周期内。
3. 不要一次性导入全部代码。
4. 每个 PR 保持小粒度。
5. README 必须列出第三方依赖和原创部分。
6. demo 视频链接需要放入 README。
