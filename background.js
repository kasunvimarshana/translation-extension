class TranslationService {
  constructor() {
    this.translations = new Map();
    this.languages = {
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
      'hu': 'Hungarian'
    };
    this.initializeTranslationEngine();
  }

  initializeTranslationEngine() {
    // Custom translation dictionary with common phrases and words
    this.translationDatabase = {
      'en': {
        'es': {
          'hello': 'hola',
          'goodbye': 'adiós',
          'thank you': 'gracias',
          'please': 'por favor',
          'yes': 'sí',
          'no': 'no',
          'water': 'agua',
          'food': 'comida',
          'house': 'casa',
          'car': 'coche',
          'book': 'libro',
          'computer': 'computadora',
          'phone': 'teléfono',
          'money': 'dinero',
          'time': 'tiempo',
          'day': 'día',
          'night': 'noche',
          'good morning': 'buenos días',
          'good evening': 'buenas tardes',
          'how are you': 'cómo estás',
          'what is your name': 'cómo te llamas',
          'where is': 'dónde está',
          'i love you': 'te amo',
          'excuse me': 'disculpe',
          'sorry': 'lo siento'
        },
        'fr': {
          'hello': 'bonjour',
          'goodbye': 'au revoir',
          'thank you': 'merci',
          'please': 's\'il vous plaît',
          'yes': 'oui',
          'no': 'non',
          'water': 'eau',
          'food': 'nourriture',
          'house': 'maison',
          'car': 'voiture',
          'book': 'livre',
          'computer': 'ordinateur',
          'phone': 'téléphone',
          'money': 'argent',
          'time': 'temps',
          'day': 'jour',
          'night': 'nuit',
          'good morning': 'bonjour',
          'good evening': 'bonsoir',
          'how are you': 'comment allez-vous',
          'what is your name': 'quel est votre nom',
          'where is': 'où est',
          'i love you': 'je t\'aime',
          'excuse me': 'excusez-moi',
          'sorry': 'désolé'
        },
        'de': {
          'hello': 'hallo',
          'goodbye': 'auf wiedersehen',
          'thank you': 'danke',
          'please': 'bitte',
          'yes': 'ja',
          'no': 'nein',
          'water': 'wasser',
          'food': 'essen',
          'house': 'haus',
          'car': 'auto',
          'book': 'buch',
          'computer': 'computer',
          'phone': 'telefon',
          'money': 'geld',
          'time': 'zeit',
          'day': 'tag',
          'night': 'nacht',
          'good morning': 'guten morgen',
          'good evening': 'guten abend',
          'how are you': 'wie geht es dir',
          'what is your name': 'wie heißt du',
          'where is': 'wo ist',
          'i love you': 'ich liebe dich',
          'excuse me': 'entschuldigung',
          'sorry': 'es tut mir leid'
        }
      },
      'es': {
        'en': {
          'hola': 'hello',
          'adiós': 'goodbye',
          'gracias': 'thank you',
          'por favor': 'please',
          'sí': 'yes',
          'no': 'no',
          'agua': 'water',
          'comida': 'food',
          'casa': 'house',
          'coche': 'car',
          'libro': 'book',
          'computadora': 'computer',
          'teléfono': 'phone',
          'dinero': 'money',
          'tiempo': 'time',
          'día': 'day',
          'noche': 'night',
          'buenos días': 'good morning',
          'buenas tardes': 'good evening',
          'cómo estás': 'how are you',
          'cómo te llamas': 'what is your name',
          'dónde está': 'where is',
          'te amo': 'i love you',
          'disculpe': 'excuse me',
          'lo siento': 'sorry'
        }
      },
      'fr': {
        'en': {
          'bonjour': 'hello',
          'au revoir': 'goodbye',
          'merci': 'thank you',
          's\'il vous plaît': 'please',
          'oui': 'yes',
          'non': 'no',
          'eau': 'water',
          'nourriture': 'food',
          'maison': 'house',
          'voiture': 'car',
          'livre': 'book',
          'ordinateur': 'computer',
          'téléphone': 'phone',
          'argent': 'money',
          'temps': 'time',
          'jour': 'day',
          'nuit': 'night',
          'bonjour': 'good morning',
          'bonsoir': 'good evening',
          'comment allez-vous': 'how are you',
          'quel est votre nom': 'what is your name',
          'où est': 'where is',
          'je t\'aime': 'i love you',
          'excusez-moi': 'excuse me',
          'désolé': 'sorry'
        }
      },
      'de': {
        'en': {
          'hallo': 'hello',
          'auf wiedersehen': 'goodbye',
          'danke': 'thank you',
          'bitte': 'please',
          'ja': 'yes',
          'nein': 'no',
          'wasser': 'water',
          'essen': 'food',
          'haus': 'house',
          'auto': 'car',
          'buch': 'book',
          'computer': 'computer',
          'telefon': 'phone',
          'geld': 'money',
          'zeit': 'time',
          'tag': 'day',
          'nacht': 'night',
          'guten morgen': 'good morning',
          'guten abend': 'good evening',
          'wie geht es dir': 'how are you',
          'wie heißt du': 'what is your name',
          'wo ist': 'where is',
          'ich liebe dich': 'i love you',
          'entschuldigung': 'excuse me',
          'es tut mir leid': 'sorry'
        }
      }
    };

    // Load user dictionary from storage
    this.loadUserDictionary();
  }

  async loadUserDictionary() {
    try {
      const result = await chrome.storage.sync.get('userDictionary');
      if (result.userDictionary) {
        this.userDictionary = result.userDictionary;
      } else {
        this.userDictionary = {};
      }
    } catch (error) {
      console.error('Failed to load user dictionary:', error);
      this.userDictionary = {};
    }
  }

  async saveUserDictionary() {
    try {
      await chrome.storage.sync.set({ userDictionary: this.userDictionary });
    } catch (error) {
      console.error('Failed to save user dictionary:', error);
    }
  }

  async addToUserDictionary(word, translation, fromLang, toLang) {
    if (!this.userDictionary[fromLang]) {
      this.userDictionary[fromLang] = {};
    }
    if (!this.userDictionary[fromLang][toLang]) {
      this.userDictionary[fromLang][toLang] = {};
    }
    
    this.userDictionary[fromLang][toLang][word.toLowerCase()] = translation;
    await this.saveUserDictionary();
  }

  async translate(text, fromLang, toLang) {
    try {
      const cacheKey = `${text}_${fromLang}_${toLang}`;
      
      // Check cache first
      if (this.translations.has(cacheKey)) {
        return this.translations.get(cacheKey);
      }

      // Use our custom translation engine
      let translation = await this.customTranslate(text, fromLang, toLang);
      
      // Cache the result
      this.translations.set(cacheKey, translation);
      
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Translation failed');
    }
  }

  async customTranslate(text, fromLang, toLang) {
    const lowerText = text.toLowerCase().trim();
    
    // Check user dictionary first
    if (this.userDictionary[fromLang] && 
        this.userDictionary[fromLang][toLang] && 
        this.userDictionary[fromLang][toLang][lowerText]) {
      return this.userDictionary[fromLang][toLang][lowerText];
    }
    
    // Check our translation database
    if (this.translationDatabase[fromLang] && 
        this.translationDatabase[fromLang][toLang] && 
        this.translationDatabase[fromLang][toLang][lowerText]) {
      return this.translationDatabase[fromLang][toLang][lowerText];
    }

    // Word-by-word translation for unknown phrases
    const words = text.split(' ');
    const translatedWords = [];
    
    for (const word of words) {
      const lowerWord = word.toLowerCase();
      let translatedWord = word;
      
      // Check user dictionary for word
      if (this.userDictionary[fromLang] && 
          this.userDictionary[fromLang][toLang] && 
          this.userDictionary[fromLang][toLang][lowerWord]) {
        translatedWord = this.userDictionary[fromLang][toLang][lowerWord];
      } 
      // Check translation database for word
      else if (this.translationDatabase[fromLang] && 
          this.translationDatabase[fromLang][toLang] && 
          this.translationDatabase[fromLang][toLang][lowerWord]) {
        translatedWord = this.translationDatabase[fromLang][toLang][lowerWord];
      } else {
        // Apply basic linguistic transformations
        translatedWord = this.applyLinguisticRules(word, fromLang, toLang);
      }
      
      translatedWords.push(translatedWord);
    }
    
    return translatedWords.join(' ');
  }

  applyLinguisticRules(word, fromLang, toLang) {
    // Basic linguistic transformation rules
    const rules = {
      'en_es': {
        patterns: [
          { from: /tion$/, to: 'ción' },
          { from: /ly$/, to: 'mente' },
          { from: /ity$/, to: 'idad' },
          { from: /ing$/, to: 'ando' }
        ]
      },
      'en_fr': {
        patterns: [
          { from: /tion$/, to: 'tion' },
          { from: /ly$/, to: 'ment' },
          { from: /ity$/, to: 'ité' },
          { from: /ing$/, to: 'ant' }
        ]
      },
      'en_de': {
        patterns: [
          { from: /tion$/, to: 'tion' },
          { from: /ly$/, to: 'lich' },
          { from: /ity$/, to: 'ität' },
          { from: /ing$/, to: 'end' }
        ]
      },
      'es_en': {
        patterns: [
          { from: /ción$/, to: 'tion' },
          { from: /mente$/, to: 'ly' },
          { from: /idad$/, to: 'ity' },
          { from: /ando$/, to: 'ing' }
        ]
      },
      'fr_en': {
        patterns: [
          { from: /tion$/, to: 'tion' },
          { from: /ment$/, to: 'ly' },
          { from: /ité$/, to: 'ity' },
          { from: /ant$/, to: 'ing' }
        ]
      },
      'de_en': {
        patterns: [
          { from: /tion$/, to: 'tion' },
          { from: /lich$/, to: 'ly' },
          { from: /ität$/, to: 'ity' },
          { from: /end$/, to: 'ing' }
        ]
      }
    };

    const ruleKey = `${fromLang}_${toLang}`;
    if (rules[ruleKey]) {
      for (const rule of rules[ruleKey].patterns) {
        if (rule.from.test(word)) {
          return word.replace(rule.from, rule.to);
        }
      }
    }

    return word;
  }

  detectLanguage(text) {
    // Simple language detection based on character patterns
    const patterns = {
      'es': /[ñáéíóúü]/i,
      'fr': /[àâäéèêëïîôöùûüÿç]/i,
      'de': /[äöüß]/i,
      'ru': /[абвгдеёжзийклмнопрстуфхцчшщъыьэюя]/i,
      'zh': /[\u4e00-\u9fff]/,
      'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
      'ko': /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/,
      'ar': /[\u0600-\u06ff]/,
      'hi': /[\u0900-\u097F]/,
      'it': /[àèéìíîòóùú]/i,
      'pt': /[ãâáàçéêíóôõú]/i
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    // If no special characters, check for common words
    const commonWords = {
      'en': ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I'],
      'es': ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se'],
      'fr': ['le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir', 'ne', 'pas'],
      'de': ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich'],
      'it': ['il', 'lo', 'la', 'le', 'di', 'che', 'e', 'a', 'in', 'con'],
      'pt': ['o', 'a', 'os', 'as', 'de', 'em', 'e', 'que', 'do', 'da']
    };

    const textLower = text.toLowerCase();
    const wordScores = {};
    
    for (const [lang, words] of Object.entries(commonWords)) {
      wordScores[lang] = 0;
      for (const word of words) {
        if (textLower.includes(word)) {
          wordScores[lang]++;
        }
      }
    }

    let detectedLang = 'en';
    let maxScore = 0;
    
    for (const [lang, score] of Object.entries(wordScores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    return detectedLang;
  }
}

// Initialize translation service
const translationService = new TranslationService();

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    // Create main translation menu
    chrome.contextMenus.create({
      id: 'translate-selection',
      title: 'Translate "%s"',
      contexts: ['selection']
    });
    
    // Create language-specific menus
    chrome.contextMenus.create({
      id: 'translate-to-spanish',
      title: 'Translate to Spanish',
      contexts: ['selection'],
      parentId: 'translate-selection'
    });

    chrome.contextMenus.create({
      id: 'translate-to-french',
      title: 'Translate to French',
      contexts: ['selection'],
      parentId: 'translate-selection'
    });

    chrome.contextMenus.create({
      id: 'translate-to-german',
      title: 'Translate to German',
      contexts: ['selection'],
      parentId: 'translate-selection'
    });

    chrome.contextMenus.create({
      id: 'translate-to-english',
      title: 'Translate to English',
      contexts: ['selection'],
      parentId: 'translate-selection'
    });

    // Separator
    chrome.contextMenus.create({
      id: 'separator1',
      type: 'separator',
      contexts: ['selection'],
      parentId: 'translate-selection'
    });

    // Page translation
    chrome.contextMenus.create({
      id: 'translate-page',
      title: 'Translate entire page',
      contexts: ['page']
    });
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'translate-page') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'translatePage'
    });
  } else if (info.menuItemId === 'translate-to-spanish') {
    const selectedText = info.selectionText;
    const detectedLang = translationService.detectLanguage(selectedText);
    
    chrome.tabs.sendMessage(tab.id, {
      action: 'showTranslation',
      originalText: selectedText,
      fromLang: detectedLang,
      toLang: 'es'
    });
  } else if (info.menuItemId === 'translate-to-french') {
    const selectedText = info.selectionText;
    const detectedLang = translationService.detectLanguage(selectedText);
    
    chrome.tabs.sendMessage(tab.id, {
      action: 'showTranslation',
      originalText: selectedText,
      fromLang: detectedLang,
      toLang: 'fr'
    });
  } else if (info.menuItemId === 'translate-to-german') {
    const selectedText = info.selectionText;
    const detectedLang = translationService.detectLanguage(selectedText);
    
    chrome.tabs.sendMessage(tab.id, {
      action: 'showTranslation',
      originalText: selectedText,
      fromLang: detectedLang,
      toLang: 'de'
    });
  } else if (info.menuItemId === 'translate-to-english') {
    const selectedText = info.selectionText;
    const detectedLang = translationService.detectLanguage(selectedText);
    
    chrome.tabs.sendMessage(tab.id, {
      action: 'showTranslation',
      originalText: selectedText,
      fromLang: detectedLang,
      toLang: 'en'
    });
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'translate') {
    translationService.translate(message.text, message.fromLang, message.toLang)
      .then(translation => {
        sendResponse({ success: true, translation });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
  
  if (message.action === 'detectLanguage') {
    const detectedLang = translationService.detectLanguage(message.text);
    sendResponse({ language: detectedLang });
  }
  
  if (message.action === 'getLanguages') {
    sendResponse({ languages: translationService.languages });
  }
  
  if (message.action === 'addToDictionary') {
    translationService.addToUserDictionary(
      message.word,
      message.translation,
      message.fromLang,
      message.toLang
    ).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  if (message.action === 'getTranslationHistory') {
    chrome.storage.local.get('translationHistory', (result) => {
      sendResponse({ history: result.translationHistory || [] });
    });
    return true;
  }
  
  if (message.action === 'clearHistory') {
    chrome.storage.local.remove('translationHistory', () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.action === 'saveTranslation') {
    chrome.storage.local.get('translationHistory', (result) => {
      const history = result.translationHistory || [];
      history.unshift({
        original: message.original,
        translated: message.translated,
        fromLang: message.fromLang,
        toLang: message.toLang,
        timestamp: new Date().toISOString(),
        url: message.url
      });
      
      // Keep only last 100 translations
      if (history.length > 100) {
        history.splice(100);
      }
      
      chrome.storage.local.set({ translationHistory: history }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});

// Storage management
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.translationHistory) {
    console.log('Translation history updated');
  }
});

// Install/update handling
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      settings: {
        autoTranslate: false,
        showFloatingBtn: true,
        saveHistory: true,
        defaultTargetLang: 'en'
      }
    });
    
    // Show welcome page
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  }
});