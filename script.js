(function () {
    'use strict';

    var SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    var els = {
        supportBadge: null,
        listeningStatus: null,
        latencyText: null,
        costText: null,
        languageSelect: null,
        modeSelect: null,
        autoPunctuation: null,
        voiceCommands: null,
        startBtn: null,
        stopBtn: null,
        clearBtn: null,
        copyBtn: null,
        downloadBtn: null,
        editor: null,
        interimBar: null,
        interimText: null,
        toast: null,
        wordCount: null,
        sentenceCount: null,
        sessionCount: null,
        accuracyHint: null,
        logList: null,
        clearLogBtn: null,
        restoreBanner: null,
        restoreBtn: null,
        discardSavedBtn: null
    };

    var recognition = null;
    var isListening = false;
    var sessionCount = 0;
    var lastStartAt = 0;
    var toastTimer = null;
    var saveTimer = null;
    var STORAGE_KEY = 'speakflow_editor_content';

    function bindElements() {
        var ids = [
            'supportBadge', 'listeningStatus', 'latencyText', 'costText',
            'languageSelect', 'modeSelect', 'autoPunctuation', 'voiceCommands',
            'startBtn', 'stopBtn', 'clearBtn', 'copyBtn', 'downloadBtn',
            'editor', 'interimBar', 'interimText', 'toast',
            'wordCount', 'sentenceCount', 'sessionCount', 'accuracyHint',
            'logList', 'clearLogBtn', 'restoreBanner', 'restoreBtn', 'discardSavedBtn'
        ];
        for (var i = 0; i < ids.length; i++) {
            els[ids[i]] = document.getElementById(ids[i]);
        }
    }

    function isSupported() {
        return !!SpeechRecognitionAPI;
    }

    function init() {
        bindElements();

        els.costText.textContent = '预估成本：¥0.00';

        if (!isSupported()) {
            setUnsupportedState();
            return;
        }

        setSupportedState();
        createRecognizer();
        registerEvents();
        checkSavedContent();
        updateMetrics();
        updateActionButtons();
    }

    function setSupportedState() {
        els.supportBadge.textContent = '可用';
        els.supportBadge.className = 'badge badge-ready';
        els.accuracyHint.textContent = '就绪';
        addLog('浏览器语音识别已就绪');
    }

    function setUnsupportedState() {
        els.supportBadge.textContent = '不可用';
        els.supportBadge.className = 'badge badge-error';
        els.listeningStatus.textContent = '不支持';
        els.accuracyHint.textContent = '不支持';
        els.startBtn.disabled = true;
        els.stopBtn.disabled = true;
        els.languageSelect.disabled = true;
        els.modeSelect.disabled = true;
        els.autoPunctuation.disabled = true;
        els.voiceCommands.disabled = true;
        addLog('当前浏览器不支持 Web Speech API，请使用 Chrome 或 Edge');
    }

    function createRecognizer() {
        if (recognition) {
            try { recognition.abort(); } catch (e) { /* ignore */ }
        }

        recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = els.languageSelect.value;

        recognition.onstart = onRecognitionStart;
        recognition.onresult = onRecognitionResult;
        recognition.onerror = onRecognitionError;
        recognition.onend = onRecognitionEnd;
    }

    function onRecognitionStart() {
        isListening = true;
        lastStartAt = performance.now();
        els.listeningStatus.textContent = '正在聆听…';
        els.listeningStatus.classList.add('listening');
        els.accuracyHint.textContent = '识别中';
        updateUIState('recording');
        addLog('开始语音输入');
    }

    function onRecognitionResult(event) {
        var interim = '';

        for (var i = event.resultIndex; i < event.results.length; i++) {
            var transcript = event.results[i][0].transcript.trim();

            if (event.results[i].isFinal) {
                var processed = processText(transcript);
                if (handleVoiceCommand(processed)) {
                    continue;
                }
                appendText(processed);
                sessionCount += 1;
                els.sessionCount.textContent = sessionCount;

                var latency = Math.round(performance.now() - lastStartAt);
                els.latencyText.textContent = '响应延迟：' + latency + ' ms';

                addLog('识别片段：' + processed);
            } else {
                interim += transcript;
            }
        }

        els.interimText.textContent = interim || '等待语音输入…';
        els.interimBar.classList.toggle('active', !!interim);

        updateMetrics();
        updateActionButtons();
    }

    function onRecognitionError(event) {
        var errorMap = {
            'no-speech': '未检测到语音',
            'audio-capture': '未找到麦克风设备',
            'not-allowed': '麦克风权限被拒绝',
            'network': '网络连接错误',
            'aborted': '识别已中止',
            'language-not-supported': '不支持当前语言',
            'service-not-allowed': '服务不可用',
            'bad-grammar': '语法错误'
        };

        var message = errorMap[event.error] || ('识别错误：' + event.error);
        els.listeningStatus.textContent = message;
        els.accuracyHint.textContent = '错误';
        addLog('错误 — ' + message);

        if (event.error === 'no-speech' && isListening) {
            return;
        }

        if (event.error === 'aborted') {
            tryRestartOrStop();
            return;
        }

        stopRecording();
    }

    function onRecognitionEnd() {
        if (isListening) {
            try {
                recognition.start();
                addLog('自动恢复识别连接');
            } catch (e) {
                stopRecording();
                addLog('恢复连接失败，已停止');
            }
        } else {
            updateUIState('idle');
        }
    }

    function tryRestartOrStop() {
        if (!isListening) {
            updateUIState('idle');
            return;
        }
        stopRecording();
    }

    function processText(rawText) {
        var text = rawText.replace(/\s+/g, ' ');

        if (els.voiceCommands.checked) {
            text = text.replace(/换行/g, '\n');
        }

        if (els.autoPunctuation.checked) {
            text = applyPunctuation(text);
        }

        return text;
    }

    function applyPunctuation(text) {
        var result = text
            .replace(/逗号/g, '，')
            .replace(/句号/g, '。')
            .replace(/问号/g, '？')
            .replace(/感叹号/g, '！')
            .replace(/顿号/g, '、')
            .replace(/冒号/g, '：')
            .replace(/分号/g, '；');

        var mode = els.modeSelect.value;
        if (!/[。！？.!?\n]$/.test(result)) {
            if (mode === 'chat') {
                result += '。';
            } else if (mode === 'academic') {
                result += '。';
            } else {
                result += '。';
            }
        }

        return result;
    }

    function handleVoiceCommand(text) {
        if (!els.voiceCommands.checked) {
            return false;
        }

        var normalized = text.replace(/[，。！？、：；\s]/g, '');

        if (normalized === '清空文本') {
            clearText();
            addLog('语音命令：清空文本');
            return true;
        }

        if (normalized === '复制全文') {
            copyText();
            addLog('语音命令：复制全文');
            return true;
        }

        if (normalized === '删除上一句') {
            deleteLastSentence();
            addLog('语音命令：删除上一句');
            return true;
        }

        return false;
    }

    function appendText(text) {
        var editor = els.editor;
        var current = editor.value.trimEnd();

        if (current && !current.endsWith('\n') && !current.endsWith('。') && !current.endsWith('！') && !current.endsWith('？')) {
            editor.value = current + text;
        } else {
            editor.value = current + (current ? '' : '') + text;
        }

        editor.scrollTop = editor.scrollHeight;
        updateMetrics();
    }

    function deleteLastSentence() {
        var editor = els.editor;
        editor.value = editor.value.replace(/[^。！？.!?\n]+[。！？.!?]?\s*$/, '').trimEnd();
        updateMetrics();
    }

    function startRecording() {
        if (!isSupported() || isListening) {
            return;
        }

        try {
            recognition.start();
        } catch (e) {
            addLog('启动失败：' + e.message + '，尝试重新创建识别器');
            createRecognizer();
            try {
                recognition.start();
            } catch (e2) {
                els.listeningStatus.textContent = '启动失败，请刷新页面';
                els.accuracyHint.textContent = '启动失败';
                addLog('二次启动也失败：' + e2.message);
            }
        }
    }

    function stopRecording() {
        if (!isSupported() || !isListening) {
            return;
        }

        isListening = false;

        try {
            recognition.stop();
        } catch (e) {
            addLog('停止异常：' + e.message);
        }

        updateUIState('idle');
        els.listeningStatus.textContent = '已停止';
        els.listeningStatus.classList.remove('listening');
        els.accuracyHint.textContent = '就绪';
        els.interimBar.classList.remove('active');
        updateActionButtons();
    }

    function saveToStorage() {
        var text = els.editor.value;
        try {
            if (text.trim()) {
                localStorage.setItem(STORAGE_KEY, text);
            }
        } catch (e) {
            addLog('自动保存失败：存储空间不足');
        }
    }

    function loadFromStorage() {
        try {
            return localStorage.getItem(STORAGE_KEY) || '';
        } catch (e) {
            return '';
        }
    }

    function clearSavedContent() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) { /* ignore */ }
        els.restoreBanner.classList.remove('visible');
    }

    function checkSavedContent() {
        var saved = loadFromStorage();
        if (saved && !els.editor.value.trim()) {
            els.restoreBanner.classList.add('visible');
        }
    }

    function restoreSavedContent() {
        var saved = loadFromStorage();
        if (saved) {
            els.editor.value = saved;
            els.editor.scrollTop = els.editor.scrollHeight;
            updateMetrics();
            updateActionButtons();
            addLog('已恢复上次编辑内容');
            showToast('内容已恢复');
        }
    }

    function clearText() {
        els.editor.value = '';
        sessionCount = 0;
        els.sessionCount.textContent = '0';
        els.latencyText.textContent = '响应延迟：-- ms';
        els.interimText.textContent = '等待语音输入…';
        els.interimBar.classList.remove('active');
        updateMetrics();
        updateActionButtons();
    }

    function copyText() {
        var text = els.editor.value;
        if (!text.trim()) {
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                onCopySuccess();
            }).catch(function () {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            var success = document.execCommand('copy');
            if (success) {
                onCopySuccess();
            } else {
                showToast('复制失败，请手动选择文本');
            }
        } catch (e) {
            showToast('复制失败，请手动选择文本');
        }

        document.body.removeChild(textarea);
    }

    function onCopySuccess() {
        els.copyBtn.classList.add('btn-copied');
        var originalHtml = els.copyBtn.innerHTML;
        els.copyBtn.innerHTML = '<svg class="btn-icon-sm" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>已复制';

        showToast('已复制到剪贴板');

        setTimeout(function () {
            els.copyBtn.classList.remove('btn-copied');
            els.copyBtn.innerHTML = originalHtml;
        }, 2000);
    }

    function downloadText() {
        var text = els.editor.value;
        if (!text.trim()) {
            return;
        }

        var dateStr = new Date().toISOString().slice(0, 10);
        var timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
        var filename = 'speakflow-' + dateStr + '-' + timeStr + '.txt';

        var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);

        addLog('已导出 TXT 文件：' + filename);
        showToast('文件已下载');
    }

    function updateUIState(state) {
        if (state === 'recording') {
            els.startBtn.disabled = true;
            els.stopBtn.disabled = false;
            els.editor.classList.add('recording');
            els.interimBar.classList.add('active');
        } else {
            els.startBtn.disabled = false;
            els.stopBtn.disabled = true;
            els.editor.classList.remove('recording');
            els.interimBar.classList.remove('active');
        }
    }

    function updateMetrics() {
        var text = els.editor.value;
        var charCount = text.replace(/\s/g, '').length;
        var sentences = text.split(/[。！？.!?\n]+/).filter(Boolean).length;

        els.wordCount.textContent = charCount;
        els.sentenceCount.textContent = sentences;
    }

    function updateActionButtons() {
        var hasContent = !!els.editor.value.trim();
        els.copyBtn.disabled = !hasContent;
        els.downloadBtn.disabled = !hasContent;
    }

    function addLog(message) {
        var li = document.createElement('li');
        var time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        li.textContent = time + ' · ' + message;
        els.logList.insertBefore(li, els.logList.firstChild);

        while (els.logList.children.length > 30) {
            els.logList.removeChild(els.logList.lastChild);
        }
    }

    function clearLogs() {
        while (els.logList.firstChild) {
            els.logList.removeChild(els.logList.firstChild);
        }
    }

    function showToast(message) {
        if (toastTimer) {
            clearTimeout(toastTimer);
        }

        els.toast.textContent = message;
        els.toast.classList.add('show');

        toastTimer = setTimeout(function () {
            els.toast.classList.remove('show');
            toastTimer = null;
        }, 2000);
    }

    function registerEvents() {
        var originalClearText = clearText;
        clearText = function () {
            originalClearText();
            clearSavedContent();
        };

        els.startBtn.addEventListener('click', startRecording);
        els.stopBtn.addEventListener('click', stopRecording);
        els.clearBtn.addEventListener('click', clearText);
        els.copyBtn.addEventListener('click', copyText);
        els.downloadBtn.addEventListener('click', downloadText);
        els.clearLogBtn.addEventListener('click', clearLogs);

        els.editor.addEventListener('input', function () {
            updateMetrics();
            updateActionButtons();
            if (saveTimer) clearTimeout(saveTimer);
            saveTimer = setTimeout(saveToStorage, 500);
        });

        els.languageSelect.addEventListener('change', function () {
            var wasListening = isListening;
            if (wasListening) {
                stopRecording();
            }
            createRecognizer();
            if (wasListening) {
                startRecording();
            }
            addLog('切换语言：' + els.languageSelect.options[els.languageSelect.selectedIndex].text);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && isListening) {
                event.preventDefault();
                stopRecording();
                addLog('快捷键 Esc：停止录音');
            }
        });

        els.stopBtn.disabled = true;

        els.restoreBtn.addEventListener('click', function () {
            restoreSavedContent();
            clearSavedContent();
        });

        els.discardSavedBtn.addEventListener('click', function () {
            clearSavedContent();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();