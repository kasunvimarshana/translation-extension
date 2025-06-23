class TranslationContentScript {
  constructor() {
    this.settings = {
      autoDetectLanguage: true,
      showConfidence: true,
      enableContextMenu: true,
      defaultTargetLanguage: "en",
      enableHoverTranslation: false,
    };
    this.initialize();
  }

  async initialize() {
    this.settings = await this.getSettings();
    this.createTranslationPopup();
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener("mouseup", (e) => {
      setTimeout(() => this.handleTextSelection(e), 100);
    });

    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "T") {
        e.preventDefault();
        this.handleQuickTranslate();
      }
      if (e.key === "Escape") this.hideTranslationPopup();
    });

    if (this.settings.enableHoverTranslation) {
      document.addEventListener("mouseover", (e) => this.handleHover(e));
      document.addEventListener("mouseout", (e) => this.handleMouseOut(e));
    }

    window.addEventListener("message", (e) => {
      if (e.data.source === "extension") this.handleExtensionMessage(e.data);
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "translatePage") {
        this.translatePage(request.toLang);
        sendResponse({ success: true });
      }
    });
  }

  handleTextSelection(event) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0 && selectedText.length < 500) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      this.showTranslateButton(selectedText, rect);
    } else {
      this.hideTranslateButton();
    }
  }

  showTranslateButton(text, rect) {
    this.hideTranslateButton();
    
    const button = document.createElement("div");
    button.id = "translate-button";
    button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M5 8l6 6" />
      <path d="M4 14l6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="M22 22l-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>`;
    
    button.style.cssText = `
      position: absolute;
      top: ${rect.top + window.scrollY - 35}px;
      left: ${rect.left + window.scrollX + rect.width / 2 - 15}px;
      width: 30px;
      height: 30px;
      background: #4285f4;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      color: white;
      transition: all 0.2s ease;
    `;
    
    button.addEventListener("click", () => this.translateSelectedText(text));
    button.addEventListener("mouseenter", () => button.style.transform = "scale(1.1)");
    button.addEventListener("mouseleave", () => button.style.transform = "scale(1)");
    
    document.body.appendChild(button);
  }

  hideTranslateButton() {
    const button = document.getElementById("translate-button");
    if (button) button.remove();
  }

  async translateSelectedText(text) {
    this.hideTranslateButton();
    try {
      const result = await this.requestTranslation(
        text,
        "auto",
        this.settings.defaultTargetLanguage
      );
      
      if (result.success) {
        const selection = window.getSelection();
        const rect = selection.rangeCount > 0
          ? selection.getRangeAt(0).getBoundingClientRect()
          : { top: 100, left: 100, bottom: 120, width: 0 };
        
        this.showTranslationPopup(text, result.result, rect);
      }
    } catch (error) {
      this.showError("Translation failed. Please try again.");
    }
  }

  createTranslationPopup() {
    if (this.translationPopup) return;
    
    this.translationPopup = document.createElement("div");
    this.translationPopup.id = "translation-popup";
    this.translationPopup.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 10001;
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      display: none;
    `;
    
    document.body.appendChild(this.translationPopup);
  }

  showTranslationPopup(originalText, result, rect) {
    if (!this.translationPopup) return;
    
    const confidence = Math.round(result.confidence * 100);
    const detectedLang = this.getLanguageName(result.detected);
    const targetLang = this.getLanguageName(this.settings.defaultTargetLanguage);
    
    this.translationPopup.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 12px; color: #666;">
          ${detectedLang} → ${targetLang}
        </span>
        <button id="close-popup" style="background: none; border: none; font-size: 16px; cursor: pointer; color: #666;">×</button>
      </div>
      
      <div style="margin-bottom: 8px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Original:</div>
        <div style="padding: 4px; background: #f5f5f5; border-radius: 4px; font-size: 13px;">
          ${this.escapeHtml(originalText)}
        </div>
      </div>
      
      <div style="margin-bottom: 8px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Translation:</div>
        <div style="padding: 4px; background: #e8f4fd; border-radius: 4px; font-size: 13px; font-weight: 500;">
          ${this.escapeHtml(result.translation)}
        </div>
      </div>
      
      ${this.settings.showConfidence ? `
        <div style="font-size: 11px; color: #666; margin-bottom: 8px;">
          Confidence: ${confidence}%
        </div>
      ` : ""}
      
      <div style="display: flex; gap: 8px;">
        <button id="copy-translation" style="flex: 1; padding: 6px 12px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          Copy
        </button>
        <button id="speak-translation" style="flex: 1; padding: 6px 12px; background: #34a853; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          Speak
        </button>
      </div>
      
      <div style="margin-top: 8px;">
        <button id="add-to-dictionary" style="width: 100%; padding: 6px 12px; background: #fbbc04; color: #333; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          Add to Dictionary
        </button>
      </div>
    `;
    
    const popupRect = this.translationPopup.getBoundingClientRect();
    let top = rect.bottom + window.scrollY + 10;
    let left = rect.left + window.scrollX;
    
    if (left + 300 > window.innerWidth) left = window.innerWidth - 310;
    if (top + popupRect.height > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - popupRect.height - 10;
    }
    
    this.translationPopup.style.top = `${top}px`;
    this.translationPopup.style.left = `${left}px`;
    this.translationPopup.style.display = "block";
    
    document.getElementById("close-popup").addEventListener("click", () => this.hideTranslationPopup());
    document.getElementById("copy-translation").addEventListener("click", () => this.copyToClipboard(result.translation));
    document.getElementById("speak-translation").addEventListener("click", () => this.speakText(result.translation));
    document.getElementById("add-to-dictionary").addEventListener("click", () => 
      this.addToDictionary(originalText, result.translation, result.detected, this.settings.defaultTargetLanguage)
    );
    
    setTimeout(() => {
      document.addEventListener("click", this.handleOutsideClick.bind(this), { once: true });
    }, 100);
  }

  hideTranslationPopup() {
    if (this.translationPopup) this.translationPopup.style.display = "none";
  }

  handleOutsideClick(event) {
    if (this.translationPopup && !this.translationPopup.contains(event.target)) {
      this.hideTranslationPopup();
    }
  }

  async handleQuickTranslate() {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) await this.translateSelectedText(selectedText);
    else this.showError("Please select text to translate");
  }

  async handleExtensionMessage(data) {
    if (data.type === "SHOW_TRANSLATION_POPUP") {
      const result = await this.requestTranslation(data.text, "auto", data.toLang);
      if (result.success) {
        const selection = window.getSelection();
        const rect = selection.rangeCount > 0
          ? selection.getRangeAt(0).getBoundingClientRect()
          : { top: 100, left: 100, bottom: 120, width: 0 };
        this.showTranslationPopup(data.text, result.result, rect);
      }
    } else if (data.type === "TRANSLATE_PAGE_REQUEST") {
      this.translatePage();
    }
  }

  async requestTranslation(text, fromLang, toLang) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "translate",
          text: text,
          fromLang: fromLang,
          toLang: toLang,
        },
        resolve
      );
    });
  }

  async getSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getSettings" }, (response) => {
        resolve(response.success ? response.settings : {});
      });
    });
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification("Copied to clipboard!");
    } catch (error) {
      this.showError("Failed to copy text");
    }
  }

  speakText(text) {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    } else {
      this.showError("Speech synthesis not supported");
    }
  }

  getLanguageName(code) {
    const languages = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      auto: "Auto-detect",
    };
    return languages[code] || code;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message) {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4caf50;
      color: white;
      padding: 10px 16px;
      border-radius: 4px;
      z-index: 10004;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  showError(message) {
    const error = document.createElement("div");
    error.textContent = message;
    error.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 10px 16px;
      border-radius: 4px;
      z-index: 10004;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    `;
    
    document.body.appendChild(error);
    setTimeout(() => error.remove(), 3000);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new TranslationContentScript());
} else {
  new TranslationContentScript();
}