// Main Translation Engine
class TranslationEngine {
  constructor() {
    this.dictionary = {};
    this.settings = {};
    this.init();
  }
  
  init() {
    this.loadDictionary();
    this.loadSettings();
  }
  
  // Load dictionary from chrome.storage
  loadDictionary() {
    chrome.storage.local.get('translationDictionary', (result) => {
      if (result.translationDictionary) {
        this.dictionary = result.translationDictionary;
      } else {
        // Add default translations
        this.dictionary = {
          'en-es': {
            'hello': 'hola',
            'goodbye': 'adiós',
            'thank you': 'gracias',
            'please': 'por favor',
            'yes': 'sí',
            'no': 'no'
          },
          'en-fr': {
            'hello': 'bonjour',
            'goodbye': 'au revoir',
            'thank you': 'merci',
            'please': 's\'il vous plaît',
            'yes': 'oui',
            'no': 'non'
          },
          'en-de': {
            'hello': 'hallo',
            'goodbye': 'auf wiedersehen',
            'thank you': 'danke',
            'please': 'bitte',
            'yes': 'ja',
            'no': 'nein'
          }
        };
        this.saveDictionary();
      }
    });
  }
  
  // Save dictionary to chrome.storage
  saveDictionary() {
    chrome.storage.local.set({ translationDictionary: this.dictionary });
  }
  
  // Load settings from chrome.storage
  loadSettings() {
    chrome.storage.local.get('translationSettings', (result) => {
      if (result.translationSettings) {
        this.settings = result.translationSettings;
      } else {
        // Default settings
        this.settings = {
          hotkeyEnabled: true,
          defaultTargetLang: 'es'
        };
        this.saveSettings();
      }
      // Update UI with settings
      if (typeof uiController !== 'undefined') {
        uiController.updateSettingsUI();
      }
    });
  }
  
  // Save settings to chrome.storage
  saveSettings() {
    chrome.storage.local.set({ translationSettings: this.settings });
  }
  
  // Detect language based on common words
  detectLanguage(text) {
    if (!text.trim()) return 'Unknown';
    
    const words = text.toLowerCase().split(/\s+/);
    const langScores = {
      'en': 0,
      'es': 0,
      'fr': 0,
      'de': 0
    };
    
    // Common words for each language
    const commonWords = {
      'en': ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i'],
      'es': ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'por', 'con'],
      'fr': ['le', 'la', 'de', 'et', 'à', 'en', 'un', 'que', 'pour', 'dans'],
      'de': ['der', 'die', 'das', 'und', 'in', 'den', 'von', 'zu', 'für', 'mit']
    };
    
    // Score each language
    for (const lang in commonWords) {
      commonWords[lang].forEach(word => {
        if (words.includes(word)) {
          langScores[lang] += 1;
        }
      });
    }
    
    // Find language with highest score
    let maxScore = 0;
    let detectedLang = 'Unknown';
    
    for (const lang in langScores) {
      if (langScores[lang] > maxScore) {
        maxScore = langScores[lang];
        detectedLang = lang;
      }
    }
    
    // Return language name
    const langNames = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German'
    };
    
    return langNames[detectedLang] || 'Unknown';
  }
  
  // Translate text using dictionary
  translate(text, targetLang) {
    if (!text.trim()) return '';
    
    const sourceLang = 'en'; // Our dictionary is based on English as source
    const langPair = `${sourceLang}-${targetLang}`;
    const lowerText = text.toLowerCase();
    
    // First try to find exact matches in dictionary
    if (this.dictionary[langPair] && this.dictionary[langPair][lowerText]) {
      return this.dictionary[langPair][lowerText];
    }
    
    // Try to translate word by word
    const words = text.split(' ');
    const translatedWords = words.map(word => {
      const lowerWord = word.toLowerCase();
      
      // Check if word exists in dictionary
      if (this.dictionary[langPair] && this.dictionary[langPair][lowerWord]) {
        return this.dictionary[langPair][lowerWord];
      }
      
      // If no translation found, return original word
      return word;
    });
    
    return translatedWords.join(' ');
  }
  
  // Add to dictionary
  addToDictionary(source, translation, langPair) {
    if (!source.trim() || !translation.trim()) return false;
    
    if (!this.dictionary[langPair]) {
      this.dictionary[langPair] = {};
    }
    
    this.dictionary[langPair][source.toLowerCase()] = translation;
    this.saveDictionary();
    return true;
  }
  
  // Remove from dictionary
  removeFromDictionary(source, langPair) {
    if (!this.dictionary[langPair] || !this.dictionary[langPair][source]) return false;
    
    delete this.dictionary[langPair][source];
    this.saveDictionary();
    return true;
  }
  
  // Get dictionary entries
  getDictionaryEntries(langPair) {
    if (!this.dictionary[langPair]) return [];
    
    return Object.entries(this.dictionary[langPair]).map(([source, translation]) => ({
      source,
      translation
    }));
  }
}

// UI Controller
class TranslationUI {
  constructor() {
    this.engine = new TranslationEngine();
    this.initElements();
    this.initEventListeners();
    this.loadSelectedText();
  }
  
  initElements() {
    this.elements = {
      sourceText: document.getElementById('source-text'),
      sourceLang: document.getElementById('source-lang'),
      targetLang: document.getElementById('target-lang'),
      translateBtn: document.getElementById('translate-btn'),
      translationResult: document.getElementById('translation-result'),
      translationInfo: document.getElementById('translation-info'),
      
      // Dictionary elements
      sourceWord: document.getElementById('source-word'),
      targetWord: document.getElementById('target-word'),
      dictionaryLang: document.getElementById('dictionary-lang'),
      addWordBtn: document.getElementById('add-word-btn'),
      dictionaryMessage: document.getElementById('dictionary-message'),
      dictionaryEntries: document.getElementById('dictionary-entries'),
      
      // Settings elements
      enableHotkey: document.getElementById('enable-hotkey'),
      defaultLang: document.getElementById('default-lang'),
      saveSettings: document.getElementById('save-settings'),
      resetDictionary: document.getElementById('reset-dictionary'),
      exportData: document.getElementById('export-data'),
      importData: document.getElementById('import-data'),
      settingsMessage: document.getElementById('settings-message'),
      
      // Tabs
      tabs: document.querySelectorAll('.tab'),
      tabContents: document.querySelectorAll('.tab-content')
    };
  }
  
  initEventListeners() {
    // Translation events
    this.elements.translateBtn.addEventListener('click', () => this.translateText());
    this.elements.sourceText.addEventListener('input', () => this.detectLanguage());
    
    // Dictionary events
    this.elements.addWordBtn.addEventListener('click', () => this.addWordToDictionary());
    this.elements.dictionaryLang.addEventListener('change', () => this.renderDictionary());
    
    // Settings events
    this.elements.saveSettings.addEventListener('click', () => this.saveSettings());
    this.elements.resetDictionary.addEventListener('click', () => this.resetDictionary());
    this.elements.exportData.addEventListener('click', () => this.exportData());
    this.elements.importData.addEventListener('click', () => this.importData());
    
    // Tab switching
    this.elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
  }
  
  loadSelectedText() {
    // Check if we have selected text from content script
    chrome.runtime.sendMessage({ action: "getSelectedText" }, (response) => {
      if (response && response.text) {
        this.elements.sourceText.value = response.text;
        this.detectLanguage();
      }
    });
  }
  
  switchTab(tabName) {
    // Update active tab
    this.elements.tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Show active tab content
    this.elements.tabContents.forEach(content => {
      if (content.id === `${tabName}-tab`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
    
    // Refresh data if needed
    if (tabName === 'dictionary') {
      this.renderDictionary();
    }
  }
  
  detectLanguage() {
    const text = this.elements.sourceText.value;
    if (!text.trim()) {
      this.elements.sourceLang.value = '';
      return;
    }
    
    const detected = this.engine.detectLanguage(text);
    this.elements.sourceLang.value = detected;
  }
  
  translateText() {
    const text = this.elements.sourceText.value;
    const targetLang = this.elements.targetLang.value;
    
    if (!text.trim()) {
      this.showMessage(this.elements.translationResult, 'Please enter text to translate', true);
      return;
    }
    
    const detectedLang = this.engine.detectLanguage(text);
    const translation = this.engine.translate(text, targetLang);
    
    this.elements.translationResult.textContent = translation;
    this.elements.translationInfo.textContent = `Detected as ${detectedLang}, translated to ${this.getLangName(targetLang)}`;
  }
  
  getLangName(langCode) {
    const langNames = {
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese'
    };
    return langNames[langCode] || langCode;
  }
  
  addWordToDictionary() {
    const source = this.elements.sourceWord.value.trim();
    const translation = this.elements.targetWord.value.trim();
    const langPair = this.elements.dictionaryLang.value;
    
    if (!source || !translation) {
      this.showDictionaryMessage('Please enter both source and translation', true);
      return;
    }
    
    const success = this.engine.addToDictionary(source, translation, langPair);
    if (success) {
      this.showDictionaryMessage('Word added to dictionary successfully!');
      this.elements.sourceWord.value = '';
      this.elements.targetWord.value = '';
      this.renderDictionary();
    } else {
      this.showDictionaryMessage('Failed to add word to dictionary', true);
    }
  }
  
  showDictionaryMessage(message, isError = false) {
    this.elements.dictionaryMessage.textContent = message;
    this.elements.dictionaryMessage.className = 'message';
    this.elements.dictionaryMessage.classList.add(isError ? 'error' : 'success');
    this.elements.dictionaryMessage.classList.remove('hidden');
    
    setTimeout(() => {
      this.elements.dictionaryMessage.classList.add('hidden');
    }, 3000);
  }
  
  renderDictionary() {
    const langPair = this.elements.dictionaryLang.value;
    const entries = this.engine.getDictionaryEntries(langPair);
    
    if (entries.length === 0) {
      this.elements.dictionaryEntries.innerHTML = '<div class="dictionary-item"><div>No entries found for this language pair</div></div>';
      return;
    }
    
    this.elements.dictionaryEntries.innerHTML = '';
    
    entries.forEach(entry => {
      const entryElement = document.createElement('div');
      entryElement.className = 'dictionary-item';
      entryElement.innerHTML = `
        <div>
          <strong>${entry.source}</strong> → ${entry.translation}
        </div>
        <button class="remove-entry" data-source="${entry.source}" data-lang="${langPair}">Remove</button>
      `;
      this.elements.dictionaryEntries.appendChild(entryElement);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-entry').forEach(button => {
      button.addEventListener('click', (e) => {
        const source = e.target.dataset.source;
        const langPair = e.target.dataset.lang;
        this.removeDictionaryEntry(source, langPair);
      });
    });
  }
  
  removeDictionaryEntry(source, langPair) {
    if (confirm(`Are you sure you want to remove "${source}" from your dictionary?`)) {
      const success = this.engine.removeFromDictionary(source, langPair);
      if (success) {
        this.showDictionaryMessage('Word removed from dictionary');
        this.renderDictionary();
      } else {
        this.showDictionaryMessage('Failed to remove word', true);
      }
    }
  }
  
  updateSettingsUI() {
    this.elements.enableHotkey.value = this.engine.settings.hotkeyEnabled.toString();
    this.elements.defaultLang.value = this.engine.settings.defaultTargetLang;
    this.elements.targetLang.value = this.engine.settings.defaultTargetLang;
  }
  
  saveSettings() {
    this.engine.settings = {
      hotkeyEnabled: this.elements.enableHotkey.value === 'true',
      defaultTargetLang: this.elements.defaultLang.value
    };
    
    this.engine.saveSettings();
    this.showSettingsMessage('Settings saved successfully!');
  }
  
  showSettingsMessage(message, isError = false) {
    this.elements.settingsMessage.textContent = message;
    this.elements.settingsMessage.className = 'message';
    this.elements.settingsMessage.classList.add(isError ? 'error' : 'success');
    this.elements.settingsMessage.classList.remove('hidden');
    
    setTimeout(() => {
      this.elements.settingsMessage.classList.add('hidden');
    }, 3000);
  }
  
  resetDictionary() {
    if (confirm('Are you sure you want to reset your dictionary? This action cannot be undone.')) {
      this.engine.dictionary = {
        'en-es': {},
        'en-fr': {},
        'en-de': {},
        'en-it': {},
        'en-pt': {}
      };
      this.engine.saveDictionary();
      this.renderDictionary();
      this.showSettingsMessage('Dictionary has been reset');
    }
  }
  
  exportData() {
    const dataStr = JSON.stringify(this.engine.dictionary);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'localtranslate-dictionary.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
  
  importData() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const data = JSON.parse(event.target.result);
          this.engine.dictionary = data;
          this.engine.saveDictionary();
          this.renderDictionary();
          this.showSettingsMessage('Dictionary imported successfully!');
        } catch (error) {
          this.showSettingsMessage('Error parsing file: ' + error.message, true);
        }
      };
      
      reader.readAsText(file);
    };
    
    fileInput.click();
  }
}

// Initialize the UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.uiController = new TranslationUI();
});