// Content Script for Pure Translator Extension
class TranslationContentScript {
  constructor() {
    this.isInitialized = false;
    this.translationPopup = null;
    this.hoveredElement = null;
    this.settings = {};
    this.isTranslating = false;
    this.pageTranslationActive = false;
    this.originalTexts = new Map();
    this.floatingButton = null;
    
    this.init();
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      this.settings = await this.getSettings();
      this.setupEventListeners();
      this.createTranslationPopup();
      this.createFloatingButton();
      
      this.isInitialized = true;
      console.log('Pure Translator content script initialized');
    } catch (error) {
      console.error('Failed to initialize content script:', error);
    }
  }

  setupEventListeners() {
    // Text selection listener
    document.addEventListener('mouseup', (e) => {
      setTimeout(() => this.handleTextSelection(e), 100);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.handleQuickTranslate();
      }
      
      if (e.key === 'Escape') {
        this.hideTranslationPopup();
        this.hideFloatingButton();
      }
    });

    // Hover translation
    if (this.settings.enableHoverTranslation) {
      document.addEventListener('mouseover', (e) => {
        this.handleHover(e);
      });
      
      document.addEventListener('mouseout', (e) => {
        this.handleMouseOut(e);
      });
    }

    // Message listener for background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleExtensionMessage(request, sender, sendResponse);
      return true;
    });
  }

  async handleTextSelection(event) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0 && selectedText.length < 500) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      this.showFloatingButton(selectedText, rect);
    } else {
      this.hideFloatingButton();
    }
  }

  createFloatingButton() {
    if (this.floatingButton) return;
    
    this.floatingButton = document.createElement('div');
    this.floatingButton.id = 'pure-translator-floating-btn';
    this.floatingButton.innerHTML = '🌐';
    this.floatingButton.style.display = 'none';
    document.body.appendChild(this.floatingButton);

    this.floatingButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleFloatingButtonClick();
    });
  }

  showFloatingButton(text, rect) {
    if (!this.settings.showFloatingBtn) return;
    
    this.floatingButton.selectedText = text;
    this.floatingButton.style.cssText = `
      position: absolute;
      top: ${rect.top + window.scrollY - 35}px;
      left: ${rect.left + window.scrollX + (rect.width / 2) - 15}px;
      width: 30px;
      height: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      color: white;
      font-size: 14px;
      transition: all 0.2s ease;
      border: none;
    `;
  }

  hideFloatingButton() {
    if (this.floatingButton) {
      this.floatingButton.style.display = 'none';
    }
  }

  async handleFloatingButtonClick() {
    const selectedText = this.floatingButton.selectedText;
    if (!selectedText) return;

    this.hideFloatingButton();
    
    try {
      const result = await this.requestTranslation(
        selectedText, 
        'auto', 
        this.settings.defaultTargetLanguage || 'en'
      );
      
      if (result.success) {
        const selection = window.getSelection();
        const rect = selection.rangeCount > 0 ? 
          selection.getRangeAt(0).getBoundingClientRect() : 
          { top: 100, left: 100, bottom: 120, width: 0 };
        
        this.showTranslationPopup(selectedText, result.result, rect);
      }
    } catch (error) {
      console.error('Translation failed:', error);
      this.showError('Translation failed. Please try again.');
    }
  }

  createTranslationPopup() {
    if (this.translationPopup) return;
    
    this.translationPopup = document.createElement('div');
    this.translationPopup.id = 'pure-translator-popup';
    this.translationPopup.style.display = 'none';
    document.body.appendChild(this.translationPopup);
  }

  showTranslationPopup(originalText, result, rect) {
    if (!this.translationPopup) return;
    
    const confidence = Math.round(result.confidence * 100);
    const detectedLang = this.getLanguageName(result.detected);
    const targetLang = this.getLanguageName(this.settings.defaultTargetLanguage || 'en');
    
    this.translationPopup.innerHTML = `
      <div class="popup-header">
        <span class="language-info">${detectedLang} → ${targetLang}</span>
        <button class="close-btn">×</button>
      </div>
      
      <div class="popup-content">
        <div class="original-section">
          <div class="section-label">Original:</div>
          <div class="text-content original-text">${this.escapeHtml(originalText)}</div>
        </div>
        
        <div class="translation-arrow">↓</div>
        
        <div class="translation-section">
          <div class="section-label">Translation:</div>
          <div class="text-content translated-text">${this.escapeHtml(result.translation)}</div>
        </div>
        
        ${this.settings.showConfidence ? `
          <div class="confidence-info">
            Confidence: ${confidence}%
          </div>
        ` : ''}
      </div>
      
      <div class="popup-actions">
        <button class="action-btn copy-btn">📋 Copy</button>
        <button class="action-btn speak-btn">🔊 Speak</button>
        <button class="action-btn save-btn">💾 Save</button>
      </div>
    `;
    
    // Position popup
    this.positionPopup(rect);
    this.translationPopup.style.display = 'block';
    
    // Add event listeners
    this.setupPopupEventListeners(originalText, result);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (this.translationPopup.style.display === 'block') {
        this.hideTranslationPopup();
      }
    }, 10000);
  }

  positionPopup(rect) {
    const popup = this.translationPopup;
    let top = rect.bottom + window.scrollY + 10;
    let left = rect.left + window.scrollX;
    
    // Adjust position if popup goes off screen
    const popupRect = popup.getBoundingClientRect();
    if (left + 300 > window.innerWidth) {
      left = window.innerWidth - 300 - 10;
    }
    
    if (top + popupRect.height > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - popupRect.height - 10;
    }
    
    popup.style.cssText = `
      position: absolute;
      top: ${top}px;
      left: ${left}px;
      background: white;
      border: 1px solid #e1e5e9;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      z-index: 999998;
      min-width: 300px;
      max-width: 500px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      display: block;
    `;

    // Add internal styles
    const style = document.createElement('style');
    style.textContent = `
      #pure-translator-popup .popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #e1e5e9;
        background: #f8f9fa;
        border-radius: 12px 12px 0 0;
      }
      
      #pure-translator-popup .language-info {
        font-size: 12px;
        color: #666;
        font-weight: 500;
      }
      
      #pure-translator-popup .close-btn {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background-color 0.2s;
      }
      
      #pure-translator-popup .close-btn:hover {
        background-color: #e9ecef;
      }
      
      #pure-translator-popup .popup-content {
        padding: 16px;
      }
      
      #pure-translator-popup .section-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
        font-weight: 500;
      }
      
      #pure-translator-popup .text-content {
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        font-size: 13px;
      }
      
      #pure-translator-popup .original-text {
        background: #f1f3f4;
        color: #5f6368;
        font-style: italic;
      }
      
      #pure-translator-popup .translated-text {
        background: #e8f5e8;
        color: #2e7d32;
        font-weight: 500;
      }
      
      #pure-translator-popup .translation-arrow {
        text-align: center;
        color: #1976d2;
        font-size: 16px;
        margin: 8px 0;
      }
      
      #pure-translator-popup .confidence-info {
        font-size: 11px;
        color: #666;
        text-align: center;
        margin-top: 8px;
      }
      
      #pure-translator-popup .popup-actions {
        display: flex;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid #e1e5e9;
        background: #f8f9fa;
        border-radius: 0 0 12px 12px;
      }
      
      #pure-translator-popup .action-btn {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      
      #pure-translator-popup .action-btn:hover {
        background: #f3f4f6;
        border-color: #9ca3af;
      }
      
      #pure-translator-popup .copy-btn:hover {
        background: #dbeafe;
        border-color: #3b82f6;
        color: #1d4ed8;
      }
    `;
    
    if (!document.getElementById('pure-translator-styles')) {
      style.id = 'pure-translator-styles';
      document.head.appendChild(style);
    }
  }

  setupPopupEventListeners(originalText, result) {
    const popup = this.translationPopup;
    
    popup.querySelector('.close-btn').addEventListener('click', () => {
      this.hideTranslationPopup();
    });
    
    popup.querySelector('.copy-btn').addEventListener('click', () => {
      this.copyToClipboard(result.translation);
    });
    
    popup.querySelector('.speak-btn').addEventListener('click', () => {
      this.speakText(result.translation);
    });
    
    popup.querySelector('.save-btn').addEventListener('click', () => {
      this.addToDictionary(originalText, result.translation, result.detected, this.settings.defaultTargetLanguage || 'en');
    });
    
    // Hide popup when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick.bind(this), { once: true });
    }, 100);
  }

  hideTranslationPopup() {
    if (this.translationPopup) {
      this.translationPopup.style.display = 'none';
    }
  }

  handleOutsideClick(event) {
    if (this.translationPopup && 
        !this.translationPopup.contains(event.target) && 
        !this.floatingButton.contains(event.target)) {
      this.hideTranslationPopup();
    }
  }

  async handleQuickTranslate() {
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText) {
      await this.translateSelectedText(selectedText);
    } else {
      this.showError('Please select text to translate');
    }
  }

  async translateSelectedText(text) {
    try {
      const result = await this.requestTranslation(text, 'auto', this.settings.defaultTargetLanguage || 'en');
      
      if (result.success) {
        const selection = window.getSelection();
        const rect = selection.rangeCount > 0 ? 
          selection.getRangeAt(0).getBoundingClientRect() : 
          { top: 100, left: 100, bottom: 120, width: 0 };
        
        this.showTranslationPopup(text, result.result, rect);
      }
    } catch (error) {
      console.error('Translation failed:', error);
      this.showError('Translation failed. Please try again.');
    }
  }

  async handleExtensionMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'showTranslation':
        const result = await this.requestTranslation(request.text, 'auto', request.toLang);
        if (result.success) {
          const selection = window.getSelection();
          const rect = selection.rangeCount > 0 ? 
            selection.getRangeAt(0).getBoundingClientRect() : 
            { top: 100, left: 100, bottom: 120, width: 0 };
          
          this.showTranslationPopup(request.text, result.result, rect);
        }
        sendResponse({ received: true });
        break;
        
      case 'translatePage':
        this.translatePage();
        sendResponse({ received: true });
        break;
    }
  }

  async translatePage() {
    if (this.pageTranslationActive) {
      this.restorePage();
      return;
    }
    
    this.pageTranslationActive = true;
    this.showPageTranslationStatus('Translating page...');
    
    try {
      const textNodes = this.getTextNodes(document.body);
      const translationPromises = [];
      
      for (const node of textNodes.slice(0, 50)) { // Limit to first 50 nodes for performance
        const text = node.textContent.trim();
        if (text.length > 0 && text.length < 500) {
          this.originalTexts.set(node, text);
          
          translationPromises.push(
            this.requestTranslation(text, 'auto', this.settings.defaultTargetLanguage || 'en')
              .then(result => {
                if (result.success) {
                  node.textContent = result.result.translation;
                }
              })
              .catch(error => {
                console.error('Failed to translate node:', error);
              })
          );
        }
      }
      
      await Promise.all(translationPromises);
      this.showPageTranslationStatus('Page translated! Click to restore original.', true);
      
    } catch (error) {
      console.error('Page translation failed:', error);
      this.showError('Page translation failed');
      this.pageTranslationActive = false;
    }
  }

  restorePage() {
    this.originalTexts.forEach((originalText, node) => {
      node.textContent = originalText;
    });
    
    this.originalTexts.clear();
    this.pageTranslationActive = false;
    this.hidePageTranslationStatus();
  }

  getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent || !this.isTranslatableElement(parent)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          const text = node.textContent.trim();
          if (text.length === 0) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    return textNodes;
  }

  isTranslatableElement(element) {
    const tag = element.tagName.toLowerCase();
    const excludedTags = ['script', 'style', 'noscript', 'iframe', 'object', 'embed', 'code', 'pre'];
    const excludedClasses = ['notranslate', 'translate-ignore'];
    const excludedIds = ['pure-translator-popup', 'pure-translator-floating-btn'];
    
    if (excludedTags.includes(tag)) return false;
    if (excludedClasses.some(cls => element.classList.contains(cls))) return false;
    if (excludedIds.some(id => element.id === id)) return false;
    if (element.isContentEditable) return false;
    
    return true;
  }

  showPageTranslationStatus(message, isRestoreButton = false) {
    let statusBar = document.getElementById('pure-translator-status');
    
    if (!statusBar) {
      statusBar = document.createElement('div');
      statusBar.id = 'pure-translator-status';
      statusBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px;
        text-align: center;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        cursor: ${isRestoreButton ? 'pointer' : 'default'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      `;
      
      document.body.appendChild(statusBar);
    }
    
    statusBar.textContent = message;
    
    if (isRestoreButton) {
      statusBar.addEventListener('click', () => {
        this.restorePage();
      });
    }
  }

  hidePageTranslationStatus() {
    const statusBar = document.getElementById('pure-translator-status');
    if (statusBar) {
      statusBar.remove();
    }
  }

  async requestTranslation(text, fromLang, toLang) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'translate',
        text: text,
        fromLang: fromLang,
        toLang: toLang
      }, resolve);
    });
  }

  async getSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'getSettings'
      }, (response) => {
        resolve(response.success ? response.settings : {});
      });
    });
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      this.showError('Failed to copy text');
    }
  }

  speakText(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    } else {
      this.showError('Speech synthesis not supported');
    }
  }

  async addToDictionary(word, translation, fromLang, toLang) {
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'addToDictionary',
          word: word,
          translation: translation,
          fromLang: fromLang,
          toLang: toLang
        }, resolve);
      });
      
      if (response.success) {
        this.showNotification('Added to dictionary!');
      } else {
        this.showError('Failed to add to dictionary');
      }
    } catch (error) {
      console.error('Failed to add to dictionary:', error);
      this.showError('Failed to add to dictionary');
    }
  }

  getLanguageName(code) {
    const languages = {
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
    return languages[code] || code;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4caf50;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInFromTop 0.3s ease-out;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInFromTop {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    
    if (!document.getElementById('pure-translator-animations')) {
      style.id = 'pure-translator-animations';
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  showError(message) {
    const error = document.createElement('div');
    error.textContent = message;
    error.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(error);
    
    setTimeout(() => {
      error.remove();
    }, 5000);
  }

  async handleHover(event) {
    if (this.isTranslating || this.translationPopup.style.display === 'block') return;
    
    const element = event.target;
    const text = element.textContent.trim();
    
    if (text.length > 3 && text.length < 50 && this.isTranslatableElement(element)) {
      this.hoveredElement = element;
      
      setTimeout(async () => {
        if (this.hoveredElement === element) {
          try {
            const result = await this.requestTranslation(text, 'auto', this.settings.defaultTargetLanguage || 'en');
            if (result.success && this.hoveredElement === element) {
              this.showHoverTranslation(element, result.result);
            }
          } catch (error) {
            console.error('Hover translation failed:', error);
          }
        }
      }, 1000);
    }
  }

  handleMouseOut(event) {
    this.hoveredElement = null;
    this.hideHoverTranslation();
  }

  showHoverTranslation(element, result) {
    const tooltip = document.createElement('div');
    tooltip.className = 'pure-translator-hover-tooltip';
    tooltip.textContent = result.translation;
    tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 999999;
      pointer-events: none;
      max-width: 200px;
      word-wrap: break-word;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    
    const rect = element.getBoundingClientRect();
    tooltip.style.top = `${rect.top + window.scrollY - 35}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    
    document.body.appendChild(tooltip);
  }

  hideHoverTranslation() {
    const tooltip = document.querySelector('.pure-translator-hover-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TranslationContentScript();
  });
} else {
  new TranslationContentScript();
}