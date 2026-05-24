class SpeakFlowInput {
  constructor() {
    this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = null;
    this.isListening = false;
    this.sessionCount = 0;
    this.lastStartAt = 0;
    this.elements = this.bindElements();
    this.init();
  }

  bindElements() {
    const ids = [
      'supportBadge', 'listeningStatus', 'latencyText', 'languageSelect', 'modeSelect',
      'autoPunctuation', 'voiceCommands', 'startBtn', 'stopBtn', 'clearBtn', 'copyBtn',
      'downloadBtn', 'editor', 'interimText', 'wordCount', 'sentenceCount', 'sessionCount',
      'costText', 'logList'
    ];
    return Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  }

  init() {
    this.elements.costText.textContent = '¥0';
    if (!this.SpeechRecognition) {
      this.setSupport(false, '当前浏览器不支持 Web Speech API，请使用 Chrome/Edge 演示。');
      this.elements.startBtn.disabled = true;
      return;
    }
    this.setSupport(true, '浏览器端识别可用');
    this.createRecognizer();
    this.registerEvents();
    this.updateMetrics();
  }

  setSupport(isReady, text) {
    this.elements.supportBadge.textContent = isReady ? '可用' : '不可用';
    this.elements.supportBadge.className = `badge ${isReady ? 'ready' : 'error'}`;
    this.addLog(text);
  }

  createRecognizer() {
    this.recognition = new this.SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.elements.languageSelect.value;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.lastStartAt = performance.now();
      this.elements.listeningStatus.textContent = '正在聆听';
      this.elements.startBtn.disabled = true;
      this.elements.stopBtn.disabled = false;
      this.addLog('开始语音输入');
    };

    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onerror = (event) => {
      this.addLog(`识别错误：${event.error}`);
      this.elements.listeningStatus.textContent = '识别异常';
    };
    this.recognition.onend = () => {
      this.isListening = false;
      this.elements.listeningStatus.textContent = '已停止';
      this.elements.startBtn.disabled = false;
      this.elements.stopBtn.disabled = true;
      this.elements.interimText.textContent = '实时识别结果会显示在这里。';
    };
  }

  registerEvents() {
    this.elements.startBtn.addEventListener('click', () => this.start());
    this.elements.stopBtn.addEventListener('click', () => this.stop());
    this.elements.clearBtn.addEventListener('click', () => this.clearText());
    this.elements.copyBtn.addEventListener('click', () => this.copyText());
    this.elements.downloadBtn.addEventListener('click', () => this.downloadText());
    this.elements.editor.addEventListener('input', () => this.updateMetrics());
    this.elements.languageSelect.addEventListener('change', () => {
      const wasListening = this.isListening;
      if (wasListening) this.stop();
      this.createRecognizer();
      if (wasListening) this.start();
    });
    this.elements.stopBtn.disabled = true;
  }

  start() {
    if (!this.recognition || this.isListening) return;
    try {
      this.recognition.start();
    } catch (error) {
      this.addLog(`启动失败：${error.message}`);
    }
  }

  stop() {
    if (this.recognition && this.isListening) this.recognition.stop();
  }

  handleResult(event) {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0].transcript.trim();
      if (event.results[i].isFinal) {
        const finalText = this.processText(transcript);
        if (this.handleVoiceCommand(finalText)) return;
        this.appendText(finalText);
        this.sessionCount += 1;
        this.elements.sessionCount.textContent = this.sessionCount;
        const latency = Math.round(performance.now() - this.lastStartAt);
        this.elements.latencyText.textContent = `响应延迟：${latency} ms`;
        this.addLog(`识别片段：${finalText}`);
      } else {
        interim += transcript;
      }
    }
    this.elements.interimText.textContent = interim || '实时识别结果会显示在这里。';
  }

  processText(rawText) {
    let text = rawText.replace(/\s+/g, '');
    if (this.elements.voiceCommands.checked) {
      text = text.replaceAll('换行', '\n');
    }
    if (this.elements.autoPunctuation.checked) {
      text = this.addPunctuation(text);
    }
    return text;
  }

  addPunctuation(text) {
    const mode = this.elements.modeSelect.value;
    let result = text
      .replaceAll('逗号', '，')
      .replaceAll('句号', '。')
      .replaceAll('问号', '？')
      .replaceAll('感叹号', '！');
    if (!/[。！？.!?\n]$/.test(result)) {
      result += mode === 'chat' ? '。' : '。';
    }
    return result;
  }

  handleVoiceCommand(text) {
    if (!this.elements.voiceCommands.checked) return false;
    const normalized = text.replace(/[，。！？\s]/g, '');
    if (normalized === '清空文本') {
      this.clearText();
      return true;
    }
    if (normalized === '复制全文') {
      this.copyText();
      return true;
    }
    if (normalized === '删除上一句') {
      this.deleteLastSentence();
      return true;
    }
    return false;
  }

  appendText(text) {
    const editor = this.elements.editor;
    const separator = editor.value && !editor.value.endsWith('\n') ? '' : '';
    editor.value = `${editor.value}${separator}${text}`;
    this.updateMetrics();
  }

  deleteLastSentence() {
    const editor = this.elements.editor;
    editor.value = editor.value.replace(/[^。！？.!?\n]+[。！？.!?]?\s*$/, '');
    this.updateMetrics();
    this.addLog('已删除上一句');
  }

  clearText() {
    this.elements.editor.value = '';
    this.sessionCount = 0;
    this.elements.sessionCount.textContent = '0';
    this.updateMetrics();
    this.addLog('已清空文本');
  }

  async copyText() {
    try {
      await navigator.clipboard.writeText(this.elements.editor.value);
      this.addLog('已复制全文到剪贴板');
    } catch {
      this.elements.editor.select();
      document.execCommand('copy');
      this.addLog('已使用兼容模式复制全文');
    }
  }

  downloadText() {
    const blob = new Blob([this.elements.editor.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `speakflow-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.addLog('已导出 TXT 文件');
  }

  updateMetrics() {
    const text = this.elements.editor.value;
    const normalized = text.replace(/\s/g, '');
    const sentences = text.split(/[。！？.!?\n]+/).filter(Boolean).length;
    this.elements.wordCount.textContent = normalized.length;
    this.elements.sentenceCount.textContent = sentences;
  }

  addLog(message) {
    const li = document.createElement('li');
    li.textContent = `${new Date().toLocaleTimeString()} · ${message}`;
    this.elements.logList.prepend(li);
    while (this.elements.logList.children.length > 20) {
      this.elements.logList.removeChild(this.elements.logList.lastChild);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => new SpeakFlowInput());
