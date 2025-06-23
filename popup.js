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
      defaultTargetLang: 'en'
    };
    this.init();
  }

  async init() {
    await this.loadLanguages();
    await this.loadSettings();
    await this.loadHistory();
    this.setupEventListeners();
    this.updateUI();
    this.calculateStatistics();
  }

  async loadLanguages() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getLanguages' });
      this.languages = response.languages;
      this.populateLanguageSelects();
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  }

  populateLanguageSelects() {
    const sourceSelect = document.getElementById('source-lang');
    const targetSelect = document.getElementById('target-lang');
    const defaultTargetSelect = document.getElementById('default-target-lang');
    
    // Clear existing options (keep auto-detect for source)
    sourceSelect.innerHTML = '<option value="auto">Auto-detect</option>';
    targetSelect.innerHTML = '';
    defaultTargetSelect.innerHTML = '';
    
    // Populate language options
    for (const [code, name] of Object.entries(this.languages)) {
      sourceSelect.innerHTML += `<option value="${code}">${name}</option>`;
      targetSelect.innerHTML += `<option value="${code}">${name}</option>`;
      defaultTargetSelect.innerHTML += `<option value="${code}">${name}</option>`;
    }
    
    // Set default target to user preference
    targetSelect.value = this.settings.defaultTargetLang || 'en';
    defaultTargetSelect.value = this.settings.defaultTargetLang || 'en';
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get('settings');
      if (result.settings) {
        this.settings = result.settings;
        
        // Update UI to reflect settings
        document.getElementById('auto-translate').checked = this.settings.autoTranslate;
        document.getElementById('show-floating-btn').checked = this.settings.showFloatingBtn;
        document.getElementById('save-history').checked = this.settings.saveHistory;
        document.getElementById('default-target-lang').value = this.settings.defaultTargetLang || 'en';
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({ settings: this.settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async loadHistory() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTranslationHistory' });
      this.translationHistory = response.history || [];
      this.renderHistory();
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  renderHistory() {
    const historyList = document.getElementById('history-list');
    
    if (this.translationHistory.length === 0) {
      historyList.innerHTML = '<div class="no-history">No translations yet</div>';
      return;
    }
    
    historyList.innerHTML = '';
    
    this.translationHistory.forEach((item, index) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.innerHTML = `
        <div class="history-original">${this.escapeHtml(item.original)}</div>
        <div class="history-translated">${this.escapeHtml(item.translated)}</div>
        <div class="history-meta">
          <span>${this.getLanguageName(item.fromLang)} → ${this.getLanguageName(item.toLang)}</span>
          <span>${new Date(item.timestamp).toLocaleString()}</span>
        </div>
      `;
      
      historyItem.addEventListener('click', () => {
        this.useHistoryItem(item);
      });
      
      historyList.appendChild(historyItem);
    });
  }

  useHistoryItem(item) {
    document.getElementById('source-text').value = item.original;
    document.getElementById('translated-text').textContent = item.translated;
    document.getElementById('source-lang').value = item.fromLang;
    document.getElementById('target-lang').value = item.toLang;
  }

  async clearHistory() {
    try {
      await chrome.runtime.sendMessage({ action: 'clearHistory' });
      this.translationHistory = [];
      this.renderHistory();
      this.calculateStatistics();
      this.showNotification('History cleared');
    } catch (error) {
      console.error('Failed to clear history:', error);
      this.showError('Failed to clear history');
    }
  }

  async exportHistory() {
    try {
      const blob = new Blob([JSON.stringify(this.translationHistory, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pure-translator-history.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Failed to export history:', error);
      this.showError('Failed to export history');
    }
  }

  calculateStatistics() {
    // Total translations
    document.getElementById('total-translations').textContent = this.translationHistory.length;
    
    // Languages used
    const languages = new Set();
    this.translationHistory.forEach(item => {
      languages.add(item.fromLang);
      languages.add(item.toLang);
    });
    document.getElementById('languages-used').textContent = languages.size;
    
    // Characters translated
    const chars = this.translationHistory.reduce((sum, item) => {
      return sum + item.original.length;
    }, 0);
    document.getElementById('characters-translated').textContent = chars.toLocaleString();
  }

  async translateText() {
    const sourceText = document.getElementById('source-text').value.trim();
    if (!sourceText) {
      this.showError('Please enter text to translate');
      return;
    }
    
    const sourceLang = document.getElementById('source-lang').value;
    const targetLang = document.getElementById('target-lang').value;
    
    if (sourceLang === targetLang) {
      this.showError('Source and target languages cannot be the same');
      return;
    }
    
    this.isTranslating = true;
    this.updateTranslateButton();
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: sourceText,
        fromLang: sourceLang === 'auto' ? undefined : sourceLang,
        toLang: targetLang
      });
      
      if (response.success) {
        document.getElementById('translated-text').textContent = response.translation;
        
        // Save to history if enabled
        if (this.settings.saveHistory) {
          const detectedLang = sourceLang === 'auto' ? 
            await this.detectLanguage(sourceText) : sourceLang;
            
          await chrome.runtime.sendMessage({
            action: 'saveTranslation',
            original: sourceText,
            translated: response.translation,
            fromLang: detectedLang,
            toLang: targetLang,
            url: 'popup'
          });
          
          // Reload history to show new item
          await this.loadHistory();
          this.calculateStatistics();
        }
      } else {
        this.showError('Translation failed: ' + response.error);
      }
    } catch (error) {
      console.error('Translation error:', error);
      this.showError('Translation failed');
    } finally {
      this.isTranslating = false;
      this.updateTranslateButton();
    }
  }

  async detectLanguage(text) {
    const response = await chrome.runtime.sendMessage({
      action: 'detectLanguage',
      text: text
    });
    return response.language;
  }

  updateTranslateButton() {
    const btn = document.getElementById('translate-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    
    if (this.isTranslating) {
      btn.disabled = true;
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline-block';
    } else {
      btn.disabled = false;
      btnText.style.display = 'inline-block';
      btnLoader.style.display = 'none';
    }
  }

  swapLanguages() {
    const sourceLang = document.getElementById('source-lang');
    const targetLang = document.getElementById('target-lang');
    const sourceText = document.getElementById('source-text');
    const translatedText = document.getElementById('translated-text');
    
    // Don't swap if source is auto-detect
    if (sourceLang.value === 'auto') return;
    
    const tempLang = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = tempLang;
    
    // Also swap texts if both exist
    if (sourceText.value && translatedText.textContent !== 'Translation will appear here...') {
      const tempText = sourceText.value;
      sourceText.value = translatedText.textContent;
      translatedText.textContent = tempText;
    }
  }

  copyTranslation() {
    const translatedText = document.getElementById('translated-text').textContent;
    if (translatedText && translatedText !== 'Translation will appear here...') {
      navigator.clipboard.writeText(translatedText)
        .then(() => this.showNotification('Copied to clipboard'))
        .catch(() => this.showError('Failed to copy'));
    }
  }

  speakTranslation() {
    const translatedText = document.getElementById('translated-text').textContent;
    if (translatedText && translatedText !== 'Translation will appear here...') {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(translatedText);
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      } else {
        this.showError('Text-to-speech not supported');
      }
    }
  }

  saveCurrentTranslation() {
    const sourceText = document.getElementById('source-text').value.trim();
    const translatedText = document.getElementById('translated-text').textContent;
    const sourceLang = document.getElementById('source-lang').value;
    const targetLang = document.getElementById('target-lang').value;
    
    if (!sourceText || translatedText === 'Translation will appear here...') {
      this.showError('No translation to save');
      return;
    }
    
    if (sourceLang === 'auto') {
      this.showError('Cannot save with auto-detect source language');
      return;
    }
    
    chrome.runtime.sendMessage({
      action: 'addToDictionary',
      word: sourceText,
      translation: translatedText,
      fromLang: sourceLang,
      toLang: targetLang
    }).then(response => {
      if (response.success) {
        this.showNotification('Added to dictionary!');
      } else {
        this.showError('Failed to add to dictionary');
      }
    }).catch(error => {
      this.showError('Error adding to dictionary');
    });
  }

  async translatePage() {
    const sourceLang = document.getElementById('source-lang').value;
    const targetLang = document.getElementById('target-lang').value;
    
    if (sourceLang === targetLang) {
      this.showError('Source and target languages cannot be the same');
      return;
    }
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'translatePage',
          sourceLang: sourceLang === 'auto' ? undefined : sourceLang,
          toLang: targetLang
        });
        
        this.showNotification('Page translation started');
      }
    } catch (error) {
      console.error('Page translation failed:', error);
      this.showError('Page translation failed. Make sure to refresh the page first.');
    }
  }

  setupEventListeners() {
    // Translate button
    document.getElementById('translate-btn').addEventListener('click', () => {
      this.translateText();
    });
    
    // Swap languages
    document.getElementById('swap-languages').addEventListener('click', () => {
      this.swapLanguages();
    });
    
    // Clear text
    document.getElementById('clear-text').addEventListener('click', () => {
      document.getElementById('source-text').value = '';
      document.getElementById('char-count').textContent = '0';
    });
    
    // Character count
    document.getElementById('source-text').addEventListener('input', (e) => {
      document.getElementById('char-count').textContent = e.target.value.length;
    });
    
    // Copy result
    document.getElementById('copy-result').addEventListener('click', () => {
      this.copyTranslation();
    });
    
    // Speak result
    document.getElementById('speak-result').addEventListener('click', () => {
      this.speakTranslation();
    });
    
    // Save translation
    document.getElementById('save-translation').addEventListener('click', () => {
      this.saveCurrentTranslation();
    });
    
    // Clear history
    document.getElementById('clear-history').addEventListener('click', () => {
      this.clearHistory();
    });
    
    // Export history
    document.getElementById('export-history').addEventListener('click', () => {
      this.exportHistory();
    });
    
    // Translate page
    document.getElementById('translate-page').addEventListener('click', () => {
      this.translatePage();
    });
    
    // Settings changes
    document.getElementById('auto-translate').addEventListener('change', (e) => {
      this.settings.autoTranslate = e.target.checked;
      this.saveSettings();
    });
    
    document.getElementById('show-floating-btn').addEventListener('change', (e) => {
      this.settings.showFloatingBtn = e.target.checked;
      this.saveSettings();
    });
    
    document.getElementById('save-history').addEventListener('change', (e) => {
      this.settings.saveHistory = e.target.checked;
      this.saveSettings();
    });
    
    document.getElementById('default-target-lang').addEventListener('change', (e) => {
      this.settings.defaultTargetLang = e.target.value;
      this.saveSettings();
    });
    
    // Help and feedback links
    document.getElementById('help-link').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: chrome.runtime.getURL('help.html') });
    });
    
    document.getElementById('feedback-link').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://example.com/feedback' });
    });
  }

  getLanguageName(code) {
    return this.languages[code] || code.toUpperCase();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'pure-translator-notification';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '1000';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  showError(message) {
    const notification = document.createElement('div');
    notification.className = 'pure-translator-notification';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#f44336';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '1000';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  updateUI() {
    // Set initial values based on settings
    document.getElementById('auto-translate').checked = this.settings.autoTranslate;
    document.getElementById('show-floating-btn').checked = this.settings.showFloatingBtn;
    document.getElementById('save-history').checked = this.settings.saveHistory;
    document.getElementById('default-target-lang').value = this.settings.defaultTargetLang || 'en';
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});