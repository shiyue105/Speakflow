(function () {
    'use strict';

    var startBtn = document.getElementById('startBtn');
    var stopBtn = document.getElementById('stopBtn');
    var copyBtn = document.getElementById('copyBtn');
    var resultBox = document.getElementById('resultBox');
    var finalText = document.getElementById('finalText');
    var interimText = document.getElementById('interimText');
    var placeholderText = document.getElementById('placeholderText');
    var statusIndicator = document.getElementById('statusIndicator');
    var statusText = document.getElementById('statusText');
    var charCount = document.getElementById('charCount');
    var langBadge = document.getElementById('langBadge');
    var toast = document.getElementById('toast');

    var recognition = null;
    var isRecording = false;
    var accumulatedText = '';
    var toastTimer = null;

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    function isSpeechSupported() {
        return !!SpeechRecognition;
    }

    function initRecognition() {
        if (!isSpeechSupported()) {
            setUnsupportedState();
            return;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'zh-CN';

        recognition.onstart = handleRecognitionStart;
        recognition.onresult = handleRecognitionResult;
        recognition.onerror = handleRecognitionError;
        recognition.onend = handleRecognitionEnd;
    }

    function setUnsupportedState() {
        startBtn.disabled = true;
        stopBtn.disabled = true;
        copyBtn.disabled = true;
        placeholderText.textContent = '您的浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器。';
        placeholderText.classList.remove('hidden');
        statusText.textContent = '不支持';
        statusIndicator.classList.add('recording');
        langBadge.textContent = '不支持';
    }

    function handleRecognitionStart() {
        isRecording = true;
        updateUIState('recording');
    }

    function handleRecognitionResult(event) {
        var newInterim = '';

        for (var i = event.resultIndex; i < event.results.length; i++) {
            var result = event.results[i];
            var transcript = result[0].transcript;

            if (result.isFinal) {
                accumulatedText += transcript;
            } else {
                newInterim += transcript;
            }
        }

        interimText.textContent = newInterim;
        finalText.textContent = accumulatedText;

        if (accumulatedText || newInterim) {
            placeholderText.classList.add('hidden');
        } else {
            placeholderText.classList.remove('hidden');
        }

        updateCharCount();
        updateCopyButton();
    }

    function handleRecognitionError(event) {
        console.error('语音识别错误:', event.error, event.message);

        switch (event.error) {
            case 'no-speech':
                statusText.textContent = '未检测到语音';
                break;
            case 'audio-capture':
                statusText.textContent = '未找到麦克风设备';
                break;
            case 'not-allowed':
                statusText.textContent = '麦克风权限被拒绝';
                break;
            case 'network':
                statusText.textContent = '网络错误';
                break;
            case 'aborted':
                statusText.textContent = '识别已中止';
                break;
            default:
                statusText.textContent = '识别错误';
                break;
        }

        if (event.error === 'no-speech' && isRecording) {
            return;
        }

        stopRecording();
    }

    function handleRecognitionEnd() {
        if (isRecording) {
            try {
                recognition.start();
            } catch (e) {
                stopRecording();
            }
        } else {
            updateUIState('idle');
        }
    }

    function startRecording() {
        if (!isSpeechSupported() || isRecording) return;

        accumulatedText = '';
        finalText.textContent = '';
        interimText.textContent = '';
        placeholderText.classList.remove('hidden');

        try {
            recognition.start();
        } catch (e) {
            console.error('启动语音识别失败:', e);
            statusText.textContent = '启动失败，请重试';
            return;
        }
    }

    function stopRecording() {
        if (!isSpeechSupported() || !isRecording) return;

        isRecording = false;

        try {
            recognition.stop();
        } catch (e) {
            console.error('停止语音识别失败:', e);
        }

        var finalResult = accumulatedText + interimText.textContent;
        accumulatedText = finalResult;
        finalText.textContent = accumulatedText;
        interimText.textContent = '';

        updateUIState('idle');
        updateCharCount();
        updateCopyButton();

        if (accumulatedText) {
            placeholderText.classList.add('hidden');
        }
    }

    function updateUIState(state) {
        if (state === 'recording') {
            startBtn.disabled = true;
            stopBtn.disabled = false;
            statusText.textContent = '录音中...';
            statusIndicator.classList.add('recording');
            resultBox.classList.add('recording');
        } else {
            startBtn.disabled = false;
            stopBtn.disabled = true;
            statusText.textContent = '就绪';
            statusIndicator.classList.remove('recording');
            resultBox.classList.remove('recording');
        }
    }

    function updateCharCount() {
        var text = accumulatedText + interimText.textContent;
        var count = text.replace(/\s/g, '').length;
        charCount.textContent = count + ' 字';
    }

    function updateCopyButton() {
        var hasContent = !!(accumulatedText || interimText.textContent);
        copyBtn.disabled = !hasContent;
    }

    function copyToClipboard() {
        var text = accumulatedText + interimText.textContent;
        if (!text.trim()) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                showCopySuccess();
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
                showCopySuccess();
            } else {
                showCopyFailure();
            }
        } catch (e) {
            showCopyFailure();
        }

        document.body.removeChild(textarea);
    }

    function showCopySuccess() {
        copyBtn.classList.add('copied');
        var originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg class="btn-icon-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>已复制</span>';

        showToast('已复制到剪贴板');

        setTimeout(function () {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = originalHtml;
        }, 2000);
    }

    function showCopyFailure() {
        showToast('复制失败，请手动选择文本复制');
    }

    function showToast(message) {
        if (toastTimer) {
            clearTimeout(toastTimer);
        }

        toast.textContent = message;
        toast.classList.add('show');

        toastTimer = setTimeout(function () {
            toast.classList.remove('show');
            toastTimer = null;
        }, 2000);
    }

    startBtn.addEventListener('click', startRecording);
    stopBtn.addEventListener('click', stopRecording);
    copyBtn.addEventListener('click', copyToClipboard);

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && isRecording) {
            stopRecording();
        }
    });

    initRecognition();
})();