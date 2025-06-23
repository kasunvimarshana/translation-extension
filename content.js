// Content Script for Pure Translator Extension
class TranslationUI {
  constructor() {
    this.isActive = false;
    this.translationWidget = null;
    this.originalTexts = new Map();
    this.translatedTexts = new Map();
    this.currentLanguage = 'auto';
    this.targetLanguage = 'en';
    this.settings = {};
    this.initialize();
  }

  async initialize() {
    await this.loadSettings();
    this.createUIElements();
    this.setupEventListeners();
    
    // Inject styles
    this.injectStyles();
    
    console.log('Pure Translator content script initialized');
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get('settings', (result) => {
        this.settings = result.settings || {
          autoTranslate: false,
          showFloatingBtn: true,
          saveHistory: true,
          defaultTargetLang: 'en'
        };
        resolve();
      });
    });
  }

  createUIElements() {
    // Create floating translation button
    this.floatingButton = document.createElement('div');
    this.floatingButton.id = 'pure-translator-floating-btn';
    this.floatingButton.innerHTML = '🌐';
    this.floatingButton.style.display = 'none';
    document.body.appendChild(this.floatingButton);

    // Create translation tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'pure-translator-tooltip';
    this.tooltip.innerHTML = `
      <div class="tooltip-header">
        <span class="tooltip-title">Translation</span>
        <button class="tooltip-close">×</button>
      </div>
      <div class="tooltip-content">
        <div class="original-text"></div>
        <div class="translation-arrow">↓</div>
        <div class="translated-text"></div>
        <div class="language-info"></div>
      </div>
      <div class="tooltip-actions">
        <button class="copy-btn">Copy</button>
        <button class="speak-btn">🔊</button>
        <button class="save-btn">💾</button>
      </div>
    `;
    this.tooltip.style.display = 'none';
    document.body.appendChild(this.tooltip);

    // Create page translation controls
    this.pageControls = document.createElement('div');
    this.pageControls.id = 'pure-translator-page-controls';
    this.pageControls.innerHTML = `
      <div class="page-controls-header">
        <span>Page Translation</span>
        <button class="close-page-controls">×</button>
      </div>
      <div class="page-controls-content">
        <select class="source-language">
          <option value="auto">Auto-detect</option>
        </select>
        <span class="arrow">→</span>
        <select class="target-language">
          <option value="en">English</option>
        </select>
        <button class="translate-page-btn">Translate Page</button>
        <button class="restore-page-btn" style="display:none;">Restore Original</button>
      </div>
      <div class="translation-progress" style="display:none;">
        <div class="progress-bar"></div>
        <span class="progress-text">Translating...</span>
      </div>
    `;
    this.pageControls.style.display = 'none';
    document.body.appendChild(this.pageControls);

    // Create notification container
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.id = 'pure-translator-notifications';
    document.body.appendChild(this.notificationContainer);
  }

  injectStyles() {
    // Styles are injected from content.css
    // Additional dynamic styles can be added here if needed
  }

  setupEventListeners() {
    // Text selection handling
    document.addEventListener('mouseup', (e) => {
      if (this.settings.showFloatingBtn) {
        setTimeout(() => this.handleTextSelection(e), 10);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.togglePageTranslation();
      }
      
      if (e.key === 'Escape') {
        this.hideAllUI();
      }
    });

    // Floating button click
    this.floatingButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleFloatingButtonClick();
    });

    // Tooltip events
    this.tooltip.querySelector('.tooltip-close').addEventListener('click', () => {
      this.hideTooltip();
    });
    
    this.tooltip.querySelector('.copy-btn').addEventListener('click', () => {
      this.copyTranslation();
    });
    
    this.tooltip.querySelector('.speak-btn').addEventListener('click', () => {
      this.speakTranslation();
    });
    
    this.tooltip.querySelector('.save-btn').addEventListener('click', () => {
      this.saveTranslation();
    });

    // Page controls events
    this.pageControls.querySelector('.close-page-controls').addEventListener('click', () => {
      this.hidePageControls();
    });
    
    this.pageControls.querySelector('.translate-page-btn').addEventListener('click', () => {
      this.translatePage();
    });
    
    this.pageControls.querySelector('.restore-page-btn').addEventListener('click', () => {
      this.restoreOriginalPage();
    });

    // Message listener from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'showTranslation') {
        this.showTranslation(
          message.originalText,
          message.fromLang,
          message.toLang
        );
      }
      sendResponse({ received: true });
    });
  }

  handleTextSelection(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0 && selectedText.length < 500) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      this.showFloatingButton(rect, selectedText);
    } else {
      this.hideFloatingButton();
    }
  }

  showFloatingButton(rect, selectedText) {
    this.floatingButton.style.display = 'block';
    this.floatingButton.style.left = (rect.right + window.scrollX) + 'px';
    this.floatingButton.style.top = (rect.top + window.scrollY - 30) + 'px';
    this.floatingButton.selectedText = selectedText;
  }

  hideFloatingButton() {
    this.floatingButton.style.display = 'none';
  }

  async handleFloatingButtonClick() {
    const selectedText = this.floatingButton.selectedText;
    if (!selectedText) return;

    this.hideFloatingButton();
    
    try {
      // Detect language
      const detectedLang = await this.detectLanguage(selectedText);
      const targetLang = this.settings.defaultTargetLang || 'en';
      
      // Show translation
      this.showTranslation(selectedText, detectedLang, targetLang);
    } catch (error) {
      this.showError('Translation error: ' + error.message);
    }
  }

  async showTranslation(originalText, fromLang, toLang) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: originalText,
        fromLang: fromLang,
        toLang: toLang
      });

      if (response.success) {
        this.showTooltip(originalText, response.translation, fromLang, toLang);
      } else {
        this.showError('Translation failed: ' + response.error);
      }
    } catch (error) {
      this.showError('Translation error: ' + error.message);
    }
  }

  showTooltip(originalText, translatedText, fromLang, toLang) {
    const tooltip = this.tooltip;
    
    tooltip.querySelector('.original-text').textContent = originalText;
    tooltip.querySelector('.translated-text').textContent = translatedText;
    tooltip.querySelector('.language-info').textContent = `${this.getLanguageName(fromLang)} → ${this.getLanguageName(toLang)}`;
    
    // Position tooltip near mouse or selection
    const selection = window.getSelection();
    let x = 0, y = 0;
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      x = rect.right + window.scrollX + 10;
      y = rect.top + window.scrollY;
    } else {
      x = window.innerWidth / 2;
      y = window.innerHeight / 2;
    }
    
    // Adjust position if it goes off screen
    const tooltipWidth = 300;
    if (x + tooltipWidth > window.innerWidth) {
      x = window.innerWidth - tooltipWidth - 10;
    }
    
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.style.display = 'block';
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (tooltip.style.display === 'block') {
        this.hideTooltip();
      }
    }, 10000);
  }

  hideTooltip() {
    this.tooltip.style.display = 'none';
  }

  async copyTranslation() {
    const translatedText = this.tooltip.querySelector('.translated-text').textContent;
    try {
      await navigator.clipboard.writeText(translatedText);
      this.showNotification('Translation copied to clipboard!');
    } catch (error) {
      this.showError('Failed to copy translation');
    }
  }

  speakTranslation() {
    const translatedText = this.tooltip.querySelector('.translated-text').textContent;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(translatedText);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    } else {
      this.showError('Text-to-speech not supported');
    }
  }

  async saveTranslation() {
    const originalText = this.tooltip.querySelector('.original-text').textContent;
    const translatedText = this.tooltip.querySelector('.translated-text').textContent;
    const languageInfo = this.tooltip.querySelector('.language-info').textContent;
    const [fromLang, toLang] = languageInfo.split(' → ').map(lang => lang.trim().toLowerCase());
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'saveTranslation',
        original: originalText,
        translated: translatedText,
        fromLang: fromLang,
        toLang: toLang,
        url: window.location.href
      });
      
      if (response.success) {
        this.showNotification('Translation saved to history!');
      } else {
        this.showError('Failed to save translation');
      }
    } catch (error) {
      this.showError('Error saving translation: ' + error.message);
    }
  }

  showPageControls() {
    this.populateLanguageSelects();
    this.pageControls.style.display = 'block';
  }

  hidePageControls() {
    this.pageControls.style.display = 'none';
  }

  togglePageTranslation() {
    if (this.pageControls.style.display === 'none') {
      this.showPageControls();
    } else {
      this.hidePageControls();
    }
  }

  async populateLanguageSelects() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getLanguages' });
      const languages = response.languages;
      
      const sourceSelect = this.pageControls.querySelector('.source-language');
      const targetSelect = this.pageControls.querySelector('.target-language');
      
      // Clear existing options (except auto-detect for source)
      sourceSelect.innerHTML = '<option value="auto">Auto-detect</option>';
      targetSelect.innerHTML = '';
      
      // Populate language options
      for (const [code, name] of Object.entries(languages)) {
        sourceSelect.innerHTML += `<option value="${code}">${name}</option>`;
        targetSelect.innerHTML += `<option value="${code}">${name}</option>`;
      }
      
      // Set default target to user preference
      targetSelect.value = this.settings.defaultTargetLang || 'en';
    } catch (error) {
      console.error('Failed to load languages:', error);
      this.showError('Failed to load languages');
    }
  }

  async translatePage() {
    const sourceSelect = this.pageControls.querySelector('.source-language');
    const targetSelect = this.pageControls.querySelector('.target-language');
    const progressDiv = this.pageControls.querySelector('.translation-progress');
    const progressBar = progressDiv.querySelector('.progress-bar');
    const progressText = progressDiv.querySelector('.progress-text');
    
    const sourceLang = sourceSelect.value;
    const targetLang = targetSelect.value;
    
    if (sourceLang === targetLang) {
      this.showError('Source and target languages cannot be the same');
      return;
    }
    
    // Show progress
    progressDiv.style.display = 'block';
    progressBar.style.width = '0%';
    
    try {
      // Get all text nodes
      const textNodes = this.getAllTextNodes();
      const totalNodes = textNodes.length;
      let processedNodes = 0;
      
      // Store original texts
      if (this.originalTexts.size === 0) {
        textNodes.forEach((node, index) => {
          this.originalTexts.set(index, node.textContent);
        });
      }
      
      // Translate each text node
      for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        const originalText = node.textContent.trim();
        
        if (originalText.length > 0 && originalText.length < 1000) {
          try {
            const detectedLang = sourceLang === 'auto' ? 
              await this.detectLanguage(originalText) : sourceLang;
            
            const response = await chrome.runtime.sendMessage({
              action: 'translate',
              text: originalText,
              fromLang: detectedLang,
              toLang: targetLang
            });
            
            if (response.success) {
              node.textContent = response.translation;
              this.translatedTexts.set(i, response.translation);
            }
          } catch (error) {
            console.error('Translation failed for node:', error);
          }
        }
        
        processedNodes++;
        const progress = (processedNodes / totalNodes) * 100;
        progressBar.style.width = progress + '%';
        progressText.textContent = `Translating... ${Math.round(progress)}%`;
        
        // Small delay to prevent overwhelming the system
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // Show restore button
      this.pageControls.querySelector('.restore-page-btn').style.display = 'inline-block';
      this.showNotification('Page translated successfully!');
      
    } catch (error) {
      this.showError('Page translation failed: ' + error.message);
    } finally {
      progressDiv.style.display = 'none';
    }
  }

  getAllTextNodes() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip script, style, and other non-visible elements
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'textarea', 'input'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip our own extension elements
          if (parent.id && parent.id.startsWith('pure-translator-')) {
            return NodeFilter.FILTER_REJECT;
          }
          
          const text = node.textContent.trim();
          return text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    return textNodes;
  }

  restoreOriginalPage() {
    const textNodes = this.getAllTextNodes();
    
    textNodes.forEach((node, index) => {
      if (this.originalTexts.has(index)) {
        node.textContent = this.originalTexts.get(index);
      }
    });
    
    this.originalTexts.clear();
    this.translatedTexts.clear();
    this.pageControls.querySelector('.restore-page-btn').style.display = 'none';
    this.showNotification('Original page restored!');
  }

  async detectLanguage(text) {
    const response = await chrome.runtime.sendMessage({
      action: 'detectLanguage',
      text: text
    });
    return response.language;
  }

  getLanguageName(code) {
    const languageNames = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'pl': 'Polish',
      'cs': 'Czech',
      'hu': 'Hungarian',
      'auto': 'Auto-detect'
    };
    
    return languageNames[code] || code.toUpperCase();
  }

  showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `pure-translator-notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    
    this.notificationContainer.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  showError(message) {
    this.showNotification(message, true);
  }

  hideAllUI() {
    this.hideFloatingButton();
    this.hideTooltip();
    this.hidePageControls();
  }
}

// Initialize translation UI when page loads
document.addEventListener('DOMContentLoaded', () => {
  new TranslationUI();
});

// Also initialize if page is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  new TranslationUI();
}