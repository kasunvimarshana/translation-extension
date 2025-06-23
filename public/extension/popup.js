// Popup Script for Pure Translator Extension
class PopupController {
  constructor() {
    this.isTranslating = false;
    this.translationHistory = [];
    this.languages = {};
    this.settings = {
      autoTranslate: false,
      showFloatingBtn: true,
      saveHistory: true,
      defaultTargetLanguage: 'en',
      showConfidence: true,
      enableHover: false
    };
    this.statistics = {
      totalTranslations: 0,
      languagesUsed: 0,
      charactersTranslated: 0
    };
    this.init();
  }

  async init() {
    await this.loadLanguages();
    await this.loadSettings();
    await this.loadHistory();
    await this.loadStatistics();
    this.setupEventListeners();
    this.updateUI();
    this.populateLanguageSelects();
  }

  async loadLanguages() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSupportedLanguages' });
      if (response.success) {
        this.languages = response.languages;
      }
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  }

  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response.success) {
        this.settings = response.settings;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async loadHistory() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTranslationHistory' });
      if (response.success) {
        this.translationHistory = response.history;
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  async loadStatistics() {
    try {
      const result = await chrome.storage.local.get('statistics');
      if (result.statistics) {
        this.statistics = result.statistics;
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }

  setupEventListeners() {
    // Translation controls
    document.getElementById('translate-btn').addEventListener('click', () => {
      this.handleTranslate();
    });

    document.getElementById('clear-text').addEventListener('click', () => {
      document.getElementById('source-text').value = '';
      document.getElementById('char-count').textContent = '0';
      document.getElementById('translated-text').textContent = 'Translation will appear here...';
    });

    document.getElementById('swap-languages').addEventListener('click', () => {
      this.swapLanguages();
    });

    // Text input character counter
    document.getElementById('source-text').addEventListener('input', (e) => {
      document.getElementById('char-count').textContent = e.target.value.length;
    });

    // Result actions
    document.getElementById('copy-result').addEventListener('click', () => {
      this.copyResult();
    });

    document.getElementById('speak-result').addEventListener('click', () => {
      this.speakResult();
    });

    document.getElementById('save-translation').addEventListener('click', () => {
      this.saveCurrentTranslation();
    });

    // Page translation
    document.getElementById('translate-page').addEventListener('click', () => {
      this.translateCurrentPage();
    });

    document.getElementById('restore-page').addEventListener('click', () => {
      this.restoreCurrentPage();
    });

    // History controls
    document.getElementById('clear-history').addEventListener('click', () => {
      this.clearHistory();
    });

    document.getElementById('export-history').addEventListener('click', () => {
      this.exportHistory();
    });

    // Settings
    document.getElementById('auto-translate').addEventListener('change', (e) => {
      this.updateSetting('autoTranslate', e.target.checked);
    });

    document.getElementById('show-floating-btn').addEventListener('change', (e) => {
      this.updateSetting('showFloatingBtn', e.target.checked);
    });

    document.getElementById('save-history').addEventListener('change', (e) => {
      this.updateSetting('saveHistory', e.target.checked);
    });

    document.getElementById('enable-hover').addEventListener('change', (e) => {
      this.updateSetting('enableHoverTranslation', e.target.checked);
    });

    document.getElementById('show-confidence').addEventListener('change', (e) => {
      this.updateSetting('showConfidence', e.target.checked);
    });

    document.getElementById('default-target-lang').addEventListener('change', (e) => {
      this.updateSetting('defaultTargetLanguage', e.target.value);
    });

    // Help and feedback links
    document.getElementById('help-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.showHelp();
    });

    document.getElementById('feedback-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.showFeedback();
    });

    // Auto-translate on input if enabled
    document.getElementById('source-text').addEventListener('input', () => {
      if (this.settings.autoTranslate) {
        clearTimeout(this.autoTranslateTimeout);
        this.autoTranslateTimeout = setTimeout(() => {
          this.handleTranslate();
        }, 1000);
      }
    });
  }

  populateLanguageSelects() {
    const sourceSelect = document.getElementById('source-lang');
    const targetSelect = document.getElementById('target-lang');
    const defaultTargetSelect = document.getElementById('default-target-lang');

    // Clear existing options (except auto-detect for source)
    sourceSelect.innerHTML = '<option value="auto">Auto-detect</option>';
    targetSelect.innerHTML = '';
    defaultTargetSelect.innerHTML = '';

    // Populate language options
    Object.entries(this.languages).forEach(([code, name]) => {
      sourceSelect.innerHTML += `<option value="${code}">${name}</option>`;
      targetSelect.innerHTML += `<option value="${code}">${name}</option>`;
      defaultTargetSelect.innerHTML += `<option value="${code}">${name}</option>`;
    });

    // Set default selections
    targetSelect.value = this.settings.defaultTargetLanguage;
    defaultTargetSelect.value = this.settings.defaultTargetLanguage;
  }

  async handleTranslate() {
    const sourceText = document.getElementById('source-text').value.trim();
    const sourceLang =  document.getElementById('source-lang').value;
    const targetLang = document.getElementById('target-lang').value;

    if (!sourceText) {
      this.showError('Please enter text to translate');
      return;
    }

    if (sourceLang === targetLang && sourceLang !== 'auto') {
      this.showError('Source and target languages cannot be the same');
      return;
    }

    this.setTranslating(true);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: sourceText,
        fromLang: sourceLang,
        toLang: targetLang
      });

      if (response.success) {
        this.displayTranslationResult(response.result);
        this.updateStatistics(sourceText, response.result.translation);
      } else {
        this.showError('Translation failed: ' + response.error);
      }
    } catch (error) {
      this.showError('Translation error: ' + error.message);
    } finally {
      this.setTranslating(false);
    }
  }

  displayTranslationResult(result) {
    const resultElement = document.getElementById('translated-text');
    resultElement.textContent = result.translation;
    resultElement.style.color = '#2e7d32';
    
    // Update source language if auto-detected
    if (document.getElementById('source-lang').value === 'auto') {
      const detectedOption = document.querySelector(`#source-lang option[value="${result.detected}"]`);
      if (detectedOption) {
        detectedOption.selected = true;
      }
    }

    // Show confidence if enabled
    if (this.settings.showConfidence) {
      const confidence = Math.round(result.confidence * 100);
      resultElement.title = `Confidence: ${confidence}%`;
    }
  }

  setTranslating(isTranslating) {
    this.isTranslating = isTranslating;
    const translateBtn = document.getElementById('translate-btn');
    const btnText = translateBtn.querySelector('.btn-text');
    const btnLoader = translateBtn.querySelector('.btn-loader');

    if (isTranslating) {
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline';
      translateBtn.disabled = true;
    } else {
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
      translateBtn.disabled = false;
    }
  }

  swapLanguages() {
    const sourceSelect = document.getElementById('source-lang');
    const targetSelect = document.getElementById('target-lang');
    const sourceText = document.getElementById('source-text');
    const translatedText = document.getElementById('translated-text');

    // Don't swap if source is auto-detect
    if (sourceSelect.value === 'auto') {
      this.showError('Cannot swap when auto-detect is selected');
      return;
    }

    // Swap language selections
    const tempLang = sourceSelect.value;
    sourceSelect.value = targetSelect.value;
    targetSelect.value = tempLang;

    // Swap text content
    const tempText = sourceText.value;
    sourceText.value = translatedText.textContent === 'Translation will appear here...' ? '' : translatedText.textContent;
    translatedText.textContent = tempText || 'Translation will appear here...';

    // Update character count
    document.getElementById('char-count').textContent = sourceText.value.length;
  }

  async copyResult() {
    const resultText = document.getElementById('translated-text').textContent;
    if (resultText === 'Translation will appear here...') {
      this.showError('No translation to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(resultText);
      this.showSuccess('Translation copied to clipboard!');
    } catch (error) {
      this.showError('Failed to copy text');
    }
  }

  speakResult() {
    const resultText = document.getElementById('translated-text').textContent;
    if (resultText === 'Translation will appear here...') {
      this.showError('No translation to speak');
      return;
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(resultText);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    } else {
      this.showError('Text-to-speech not supported in this browser');
    }
  }

  async saveCurrentTranslation() {
    const sourceText = document.getElementById('source-text').value.trim();
    const resultText = document.getElementById('translated-text').textContent;
    
    if (!sourceText || resultText === 'Translation will appear here...') {
      this.showError('No translation to save');
      return;
    }

    // Translation is automatically saved by background script
    this.showSuccess('Translation saved to history!');
  }

  async translateCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, { action: 'translatePage' });
      
      document.getElementById('translate-page').style.display = 'none';
      document.getElementById('restore-page').style.display = 'inline-block';
      
      this.showSuccess('Page translation started...');
    } catch (error) {
      this.showError('Failed to translate page: ' + error.message);
    }
  }

  async restoreCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, { action: 'restorePage' });
      
      document.getElementById('translate-page').style.display = 'inline-block';
      document.getElementById('restore-page').style.display = 'none';
      
      this.showSuccess('Page restored to original');
    } catch (error) {
      this.showError('Failed to restore page: ' + error.message);
    }
  }

  updateUI() {
    // Update settings checkboxes
    document.getElementById('auto-translate').checked = this.settings.autoTranslate;
    document.getElementById('show-floating-btn').checked = this.settings.showFloatingBtn;
    document.getElementById('save-history').checked = this.settings.saveHistory;
    document.getElementById('enable-hover').checked = this.settings.enableHoverTranslation;
    document.getElementById('show-confidence').checked = this.settings.showConfidence;

    // Update history display
    this.updateHistoryDisplay();

    // Update statistics display
    this.updateStatisticsDisplay();
  }

  updateHistoryDisplay() {
    const historyList = document.getElementById('history-list');
    
    if (this.translationHistory.length === 0) {
      historyList.innerHTML = '<div class="no-history">No translations yet</div>';
      return;
    }

    historyList.innerHTML = this.translationHistory.slice(0, 10).map(item => `
      <div class="history-item">
        <div class="history-original">${this.escapeHtml(item.originalText)}</div>
        <div class="history-translated">${this.escapeHtml(item.translatedText)}</div>
        <div class="history-meta">
          ${item.fromLang?.toUpperCase()} → ${item.toLang?.toUpperCase()} • 
          ${this.formatDate(item.timestamp)}
        </div>
      </div>
    `).join('');
  }

  updateStatisticsDisplay() {
    document.getElementById('total-translations').textContent = this.statistics.totalTranslations;
    document.getElementById('languages-used').textContent = this.statistics.languagesUsed;
    document.getElementById('characters-translated').textContent = this.statistics.charactersTranslated;
  }

  async updateStatistics(originalText, translatedText) {
    this.statistics.totalTranslations++;
    this.statistics.charactersTranslated += originalText.length;
    
    // Count unique languages used
    const usedLanguages = new Set();
    this.translationHistory.forEach(item => {
      if (item.fromLang) usedLanguages.add(item.fromLang);
      if (item.toLang) usedLanguages.add(item.toLang);
    });
    this.statistics.languagesUsed = usedLanguages.size;

    // Save statistics
    await chrome.storage.local.set({ statistics: this.statistics });
    this.updateStatisticsDisplay();
  }

  async clearHistory() {
    if (confirm('Are you sure you want to clear all translation history?')) {
      try {
        await chrome.runtime.sendMessage({ action: 'clearHistory' });
        this.translationHistory = [];
        this.updateHistoryDisplay();
        this.showSuccess('History cleared successfully');
      } catch (error) {
        this.showError('Failed to clear history');
      }
    }
  }

  exportHistory() {
    if (this.translationHistory.length === 0) {
      this.showError('No history to export');
      return;
    }

    const data = {
      exportDate: new Date().toISOString(),
      totalTranslations: this.translationHistory.length,
      translations: this.translationHistory
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `pure-translator-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showSuccess('History exported successfully');
  }

  async updateSetting(key, value) {
    this.settings[key] = value;
    
    try {
      await chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: { [key]: value }
      });
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  }

  showHelp() {
    const helpContent = `
      <h3>Pure Translator Help</h3>
      <h4>Quick Translation:</h4>
      <ul>
        <li>Enter text in the input area and click Translate</li>
        <li>Use auto-detect to automatically identify the source language</li>
        <li>Swap languages using the ⇄ button</li>
      </ul>
      
      <h4>Page Translation:</h4>
      <ul>
        <li>Click "Translate Page" to translate the entire current page</li>
        <li>Use "Restore Original" to revert changes</li>
      </ul>
      
      <h4>Text Selection:</h4>
      <ul>
        <li>Select text on any webpage to see the floating translate button</li>
        <li>Right-click selected text for context menu translation</li>
      </ul>
      
      <h4>Keyboard Shortcuts:</h4>
      <ul>
        <li>Ctrl+Shift+T: Toggle page translation</li>
        <li>Esc: Hide translation popup</li>
      </ul>
      
      <h4>Settings:</h4>
      <ul>
        <li>Auto-translate: Automatically translate as you type</li>
        <li>Floating button: Show/hide the selection translate button</li>
        <li>Hover translation: Translate text on hover (experimental)</li>
        <li>History: Save/disable translation history</li>
      </ul>
    `;
    
    this.showModal('Help', helpContent);
  }

  showFeedback() {
    const feedbackContent = `
      <h3>Feedback & Support</h3>
      <p>We'd love to hear from you! Here's how you can get in touch:</p>
      
      <h4>Report Issues:</h4>
      <ul>
        <li>Translation accuracy problems</li>
        <li>Performance issues</li>
        <li>Feature requests</li>
        <li>Bug reports</li>
      </ul>
      
      <h4>Supported Languages:</h4>
      <p>Currently supporting 20+ languages with more being added regularly.</p>
      
      <h4>Privacy:</h4>
      <p>All translations are processed locally. No data is sent to external servers.</p>
      
      <h4>Version:</h4>
      <p>Pure Translator v1.0.0</p>
    `;
    
    this.showModal('Feedback', feedbackContent);
  }

  showModal(title, content) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    `;

    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="margin: 0; color: #2c3e50;">${title}</h2>
        <button id="close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
      </div>
      <div style="color: #374151; line-height: 1.6;">
        ${content}
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close modal handlers
    document.getElementById('close-modal').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideInFromRight 0.3s ease-out;
      background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInFromRight {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    
    if (!document.getElementById('notification-styles')) {
      style.id = 'notification-styles';
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});