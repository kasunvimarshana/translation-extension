document.addEventListener('DOMContentLoaded', () => {
  class PopupController {
    constructor() {
      this.languages = {};
      this.settings = {
        autoDetect: true,
        showConfidence: true,
        defaultTargetLang: "en"
      };
      this.init();
    }

    async init() {
      this.loadSettings();
      this.loadLanguages();
      this.setupEventListeners();
      this.setupThemeToggle();
    }

    async loadLanguages() {
      try {
        const response = await chrome.runtime.sendMessage({
          action: "getSupportedLanguages"
        });
        
        if (response.success) {
          this.languages = response.languages;
          this.populateLanguageSelects();
        }
      } catch (error) {
        console.error("Failed to load languages:", error);
      }
    }

    populateLanguageSelects() {
      const sourceSelect = document.getElementById("source-lang");
      const targetSelect = document.getElementById("target-lang");
      const defaultSelect = document.getElementById("default-lang");
      
      // Clear existing options
      sourceSelect.innerHTML = '<option value="auto">Auto-detect</option>';
      targetSelect.innerHTML = '';
      defaultSelect.innerHTML = '';
      
      // Add language options
      for (const [code, name] of Object.entries(this.languages)) {
        sourceSelect.innerHTML += `<option value="${code}">${name}</option>`;
        targetSelect.innerHTML += `<option value="${code}">${name}</option>`;
        defaultSelect.innerHTML += `<option value="${code}">${name}</option>`;
      }
      
      // Set default selections
      targetSelect.value = "en";
      defaultSelect.value = this.settings.defaultTargetLang;
    }

    loadSettings() {
      chrome.storage.sync.get("userSettings", (data) => {
        if (data.userSettings) {
          this.settings = data.userSettings;
          document.getElementById("auto-detect").checked = this.settings.autoDetectLanguage;
          document.getElementById("show-confidence").checked = this.settings.showConfidence;
          document.getElementById("default-lang").value = this.settings.defaultTargetLanguage;
        }
      });
    }

    saveSettings() {
      this.settings.autoDetectLanguage = document.getElementById("auto-detect").checked;
      this.settings.showConfidence = document.getElementById("show-confidence").checked;
      this.settings.defaultTargetLanguage = document.getElementById("default-lang").value;
      
      chrome.storage.sync.set({ userSettings: this.settings });
      chrome.runtime.sendMessage({
        action: "updateSettings",
        settings: this.settings
      });
    }

    setupEventListeners() {
      // Translate button
      document.getElementById("translate-btn").addEventListener("click", () => this.translateText());
      
      // Swap languages
      document.getElementById("swap-langs").addEventListener("click", () => this.swapLanguages());
      
      // Page translation
      document.getElementById("translate-page").addEventListener("click", () => this.translatePage());
      
      // Action buttons
      document.getElementById("copy-btn").addEventListener("click", () => this.copyResult());
      document.getElementById("speak-btn").addEventListener("click", () => this.speakResult());
      document.getElementById("save-btn").addEventListener("click", () => this.saveTranslation());
      
      // Settings changes
      document.getElementById("auto-detect").addEventListener("change", () => this.saveSettings());
      document.getElementById("show-confidence").addEventListener("change", () => this.saveSettings());
      document.getElementById("default-lang").addEventListener("change", () => this.saveSettings());
    }

    setupThemeToggle() {
      const themeToggle = document.getElementById("theme-toggle");
      const currentTheme = localStorage.getItem("theme") || "light";
      document.body.setAttribute("data-theme", currentTheme);
      
      themeToggle.addEventListener("click", () => {
        const newTheme = currentTheme === "light" ? "dark" : "light";
        document.body.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
      });
    }

    async translateText() {
      const sourceText = document.getElementById("source-text").value;
      if (!sourceText.trim()) return;
      
      const sourceLang = document.getElementById("source-lang").value;
      const targetLang = document.getElementById("target-lang").value;
      
      document.getElementById("translate-btn").disabled = true;
      
      try {
        const response = await chrome.runtime.sendMessage({
          action: "translate",
          text: sourceText,
          fromLang: sourceLang,
          toLang: targetLang
        });
        
        if (response.success) {
          const result = response.result;
          document.getElementById("result-text").textContent = result.translation;
          document.getElementById("confidence").textContent = `Confidence: ${Math.round(result.confidence * 100)}%`;
          document.getElementById("detected-lang").textContent = `Detected: ${this.languages[result.detected] || result.detected}`;
        } else {
          document.getElementById("result-text").textContent = "Translation failed. Please try again.";
        }
      } catch (error) {
        console.error("Translation error:", error);
        document.getElementById("result-text").textContent = "Translation failed. Please try again.";
      } finally {
        document.getElementById("translate-btn").disabled = false;
      }
    }

    swapLanguages() {
      const sourceSelect = document.getElementById("source-lang");
      const targetSelect = document.getElementById("target-lang");
      
      const sourceValue = sourceSelect.value;
      const targetValue = targetSelect.value;
      
      // Swap values
      sourceSelect.value = targetValue === "auto" ? "en" : targetValue;
      targetSelect.value = sourceValue;
    }

    translatePage() {
      const targetLang = document.getElementById("target-lang").value;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "translatePage",
          toLang: targetLang
        });
      });
    }

    copyResult() {
      const resultText = document.getElementById("result-text").textContent;
      navigator.clipboard.writeText(resultText);
      this.showNotification("Copied to clipboard!");
    }

    speakResult() {
      const resultText = document.getElementById("result-text").textContent;
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(resultText);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      } else {
        this.showNotification("Speech not supported");
      }
    }

    showNotification(message) {
      const notification = document.createElement("div");
      notification.textContent = message;
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary-color);
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 1000;
      `;
      
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    }
  }

  new PopupController();
});