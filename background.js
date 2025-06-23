// background.js
class TranslationEngine {
  constructor() {
    this.dictionary = new Map();
    this.patterns = new Map();
    this.cache = new Map();
    this.initializeBaseDictionary();
    this.initializePatterns();
    this.loadUserData();
  }

  async loadUserData() {
    const { userDictionary = {}, userPatterns = {} } = await chrome.storage.sync.get([
      "userDictionary",
      "userPatterns",
    ]);
    
    // Merge user data with base data
    for (const [key, value] of Object.entries(userDictionary)) {
      if (!this.dictionary.has(key)) this.dictionary.set(key, {});
      Object.assign(this.dictionary.get(key), value);
    }
    
    for (const [key, value] of Object.entries(userPatterns)) {
      if (!this.patterns.has(key)) this.patterns.set(key, {});
      Object.assign(this.patterns.get(key), value);
    }
  }

  initializeBaseDictionary() {
    const baseDictionary = {
      "en-es": {
        hello: "hola",
        goodbye: "adiós",
        "thank you": "gracias",
        please: "por favor",
        yes: "sí",
        no: "no",
        water: "agua",
        food: "comida",
        house: "casa",
        car: "coche",
        book: "libro",
        time: "tiempo",
        day: "día",
        night: "noche",
        good: "bueno",
        bad: "malo",
        big: "grande",
        small: "pequeño",
        happy: "feliz",
        sad: "triste",
        love: "amor",
        friend: "amigo",
        family: "familia",
        work: "trabajo",
        school: "escuela",
        money: "dinero",
        help: "ayuda",
        beautiful: "hermoso",
        important: "importante",
        difficult: "difícil",
        easy: "fácil",
      },
      "en-fr": {
        hello: "bonjour",
        goodbye: "au revoir",
        "thank you": "merci",
        please: "s'il vous plaît",
        yes: "oui",
        no: "non",
        water: "eau",
        food: "nourriture",
        house: "maison",
        car: "voiture",
        book: "livre",
        time: "temps",
        day: "jour",
        night: "nuit",
        good: "bon",
        bad: "mauvais",
        big: "grand",
        small: "petit",
        happy: "heureux",
        sad: "triste",
        love: "amour",
        friend: "ami",
        family: "famille",
        work: "travail",
        school: "école",
        money: "argent",
        help: "aide",
        beautiful: "beau",
        important: "important",
        difficult: "difficile",
        easy: "facile",
      },
      "en-de": {
        hello: "hallo",
        goodbye: "auf wiedersehen",
        "thank you": "danke",
        please: "bitte",
        yes: "ja",
        no: "nein",
        water: "wasser",
        food: "essen",
        house: "haus",
        car: "auto",
        book: "buch",
        time: "zeit",
        day: "tag",
        night: "nacht",
        good: "gut",
        bad: "schlecht",
        big: "groß",
        small: "klein",
        happy: "glücklich",
        sad: "traurig",
        love: "liebe",
        friend: "freund",
        family: "familie",
        work: "arbeit",
        school: "schule",
        money: "geld",
        help: "hilfe",
        beautiful: "schön",
        important: "wichtig",
        difficult: "schwierig",
        easy: "einfach",
      },
    };

    Object.keys(baseDictionary).forEach((langPair) => {
      this.dictionary.set(langPair, baseDictionary[langPair]);
    });
  }

  initializePatterns() {
    this.patterns.set("en-es", {
      "good morning": "buenos días",
      "good afternoon": "buenas tardes",
      "good evening": "buenas noches",
      "how are you": "¿cómo estás?",
      "what is your name": "¿cómo te llamas?",
      "where is": "¿dónde está",
      "how much": "¿cuánto cuesta",
      "excuse me": "disculpe",
      "i am": "yo soy",
      "you are": "tú eres",
      "he is": "él es",
      "she is": "ella es",
      "we are": "nosotros somos",
      "they are": "ellos son",
    });

    this.patterns.set("en-fr", {
      "good morning": "bonjour",
      "good afternoon": "bon après-midi",
      "good evening": "bonsoir",
      "how are you": "comment allez-vous?",
      "what is your name": "comment vous appelez-vous?",
      "where is": "où est",
      "how much": "combien coûte",
      "excuse me": "excusez-moi",
      "i am": "je suis",
      "you are": "vous êtes",
      "he is": "il est",
      "she is": "elle est",
      "we are": "nous sommes",
      "they are": "ils sont",
    });

    this.patterns.set("en-de", {
      "good morning": "guten morgen",
      "good afternoon": "guten tag",
      "good evening": "guten abend",
      "how are you": "wie geht es dir?",
      "what is your name": "wie heißt du?",
      "where is": "wo ist",
      "how much": "wie viel kostet",
      "excuse me": "entschuldigung",
      "i am": "ich bin",
      "you are": "du bist",
      "he is": "er ist",
      "she is": "sie ist",
      "we are": "wir sind",
      "they are": "sie sind",
    });
  }

  detectLanguage(text) {
    const cleanText = text.toLowerCase().trim();
    if (!cleanText) return "en";

    const languageIndicators = {
      es: ["el", "la", "de", "que", "y", "en", "un", "es", "se", "no", "te", "lo", "le", "da", "su", "por", "son", "con", "para", "al", "del", "los", "las", "una", "está", "son", "como", "más", "pero", "sus", "ha", "muy", "hasta", "desde", "cuando", "ellos", "ellas", "nosotros", "¿", "¡", "ñ"],
      fr: ["le", "de", "et", "à", "un", "il", "être", "et", "avoir", "que", "pour", "dans", "ce", "son", "une", "sur", "avec", "ne", "se", "pas", "tout", "plus", "par", "grand", "en", "une", "pour", "que", "de", "son", "mais", "du", "au", "nous", "vous", "ils", "elles", "ç", "é", "è", "à", "ù"],
      de: ["der", "die", "und", "in", "den", "von", "zu", "das", "mit", "sich", "des", "auf", "für", "ist", "im", "dem", "nicht", "ein", "eine", "als", "auch", "es", "an", "werden", "aus", "er", "hat", "dass", "sie", "nach", "wird", "bei", "einer", "um", "am", "sind", "noch", "wie", "einem", "über", "einen", "so", "Sie", "zum", "war", "haben", "nur", "oder", "aber", "vor", "zur", "bis", "ß", "ä", "ö", "ü"],
      en: ["the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their"],
    };

    const words = cleanText.split(/\s+/);
    const scores = {};

    Object.keys(languageIndicators).forEach((lang) => {
      scores[lang] = 0;
      languageIndicators[lang].forEach((indicator) => {
        if (words.some((word) => word.includes(indicator))) {
          scores[lang]++;
        }
      });
    });

    let detectedLang = "en";
    let maxScore = 0;
    Object.keys(scores).forEach((lang) => {
      if (scores[lang] > maxScore) {
        maxScore = scores[lang];
        detectedLang = lang;
      }
    });

    return detectedLang;
  }

  async translate(text, fromLang = "auto", toLang = "en") {
    if (!text || text.trim() === "") {
      return { translation: "", confidence: 0, detected: fromLang };
    }

    const cleanText = text.toLowerCase().trim();
    const cacheKey = `${fromLang}-${toLang}-${cleanText}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (fromLang === "auto") {
      fromLang = this.detectLanguage(text);
    }

    const langPair = `${fromLang}-${toLang}`;
    let translation = "";
    let confidence = 0;

    if (this.patterns.has(langPair)) {
      const patterns = this.patterns.get(langPair);
      for (const [pattern, trans] of Object.entries(patterns)) {
        if (cleanText.includes(pattern.toLowerCase())) {
          translation = trans;
          confidence = 0.9;
          break;
        }
      }
    }

    if (!translation && this.dictionary.has(langPair)) {
      const dict = this.dictionary.get(langPair);
      const words = text.split(/\s+/);
      const translatedWords = [];
      let matchedWords = 0;

      words.forEach((word) => {
        const cleanWord = word.toLowerCase().replace(/[^\w\s]/g, "");
        if (dict[cleanWord]) {
          translatedWords.push(dict[cleanWord]);
          matchedWords++;
        } else {
          let found = false;
          for (const [key, value] of Object.entries(dict)) {
            if (key.includes(cleanWord) || cleanWord.includes(key)) {
              translatedWords.push(value);
              matchedWords += 0.5;
              found = true;
              break;
            }
          }
          if (!found) {
            translatedWords.push(word);
          }
        }
      });

      translation = translatedWords.join(" ");
      confidence = matchedWords / words.length;
    }

    if (!translation || confidence < 0.1) {
      translation = await this.statisticalTranslation(text, fromLang, toLang);
      confidence = 0.3;
    }

    const result = {
      translation: translation || text,
      confidence: Math.min(confidence, 1),
      detected: fromLang,
      originalText: text,
    };

    this.cache.set(cacheKey, result);
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    return result;
  }

  statisticalTranslation(text, fromLang, toLang) {
    const transformations = {
      "en-es": {
        ing$: "ando",
        tion$: "ción",
        ly$: "mente",
        "^un": "des",
        ful$: "lleno",
      },
      "en-fr": {
        ing$: "ant",
        tion$: "tion",
        ly$: "ment",
        "^un": "dé",
        ful$: "plein",
      },
      "en-de": {
        ing$: "end",
        tion$: "ung",
        ly$: "lich",
        "^un": "un",
        ful$: "voll",
      },
    };

    const langPair = `${fromLang}-${toLang}`;
    if (transformations[langPair]) {
      let result = text;
      const rules = transformations[langPair];

      Object.keys(rules).forEach((pattern) => {
        const regex = new RegExp(pattern, "gi");
        result = result.replace(regex, rules[pattern]);
      });

      return result;
    }

    return text;
  }

  addToDictionary(word, translation, fromLang, toLang) {
    const langPair = `${fromLang}-${toLang}`;
    if (!this.dictionary.has(langPair)) {
      this.dictionary.set(langPair, {});
    }

    const dict = this.dictionary.get(langPair);
    dict[word.toLowerCase()] = translation.toLowerCase();
    this.cache.clear();
  }

  getSupportedLanguages() {
    return {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
    };
  }
}

class ExtensionBackground {
  constructor() {
    this.translationEngine = new TranslationEngine();
    this.initializeExtension();
  }

  initializeExtension() {
    this.createContextMenus();
    this.setupMessageListeners();
    this.setupStorageListeners();
  }

  createContextMenus() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: "translate-selection",
        title: 'Translate "%s"',
        contexts: ["selection"],
      });

      ["es", "fr", "de", "en"].forEach((lang) => {
        const langName = this.translationEngine.getSupportedLanguages()[lang];
        chrome.contextMenus.create({
          id: `translate-to-${lang}`,
          title: `Translate to ${langName}`,
          contexts: ["selection"],
          parentId: "translate-selection",
        });
      });

      chrome.contextMenus.create({
        id: "separator1",
        type: "separator",
        contexts: ["selection"],
        parentId: "translate-selection",
      });

      chrome.contextMenus.create({
        id: "translate-page",
        title: "Translate entire page",
        contexts: ["page"],
      });
    });
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case "translate":
          const result = await this.translateText(
            request.text,
            request.fromLang || "auto",
            request.toLang || "en"
          );
          sendResponse({ success: true, result });
          break;

        case "detectLanguage":
          const detected = this.translationEngine.detectLanguage(request.text);
          sendResponse({ success: true, language: detected });
          break;

        case "getSupportedLanguages":
          const languages = this.translationEngine.getSupportedLanguages();
          sendResponse({ success: true, languages });
          break;

        case "addToDictionary":
          this.translationEngine.addToDictionary(
            request.word,
            request.translation,
            request.fromLang,
            request.toLang
          );
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: "Unknown action" });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  async translateText(text, fromLang, toLang) {
    const result = await this.translationEngine.translate(text, fromLang, toLang);
    return result;
  }

  setupStorageListeners() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync" && changes.userSettings) {
        this.onSettingsChanged(changes.userSettings.newValue);
      }
    });
  }

  onSettingsChanged(newSettings) {
    if (newSettings.enableContextMenu === false) {
      chrome.contextMenus.removeAll();
    } else {
      this.createContextMenus();
    }
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const targetLangMap = {
    "translate-to-es": "es",
    "translate-to-fr": "fr",
    "translate-to-de": "de",
    "translate-to-en": "en",
  };

  if (info.menuItemId === "translate-page") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        window.postMessage(
          { type: "TRANSLATE_PAGE_REQUEST", source: "extension" },
          "*"
        );
      },
    });
  } else if (targetLangMap[info.menuItemId]) {
    const toLang = targetLangMap[info.menuItemId];
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (selectedText, targetLang) => {
        window.postMessage(
          {
            type: "SHOW_TRANSLATION_POPUP",
            text: selectedText,
            toLang: targetLang,
            source: "extension",
          },
          "*"
        );
      },
      args: [info.selectionText, toLang],
    });
  }
});

const extensionBackground = new ExtensionBackground();

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.sync.set({
      userSettings: {
        autoDetectLanguage: true,
        enableContextMenu: true,
        defaultTargetLanguage: "en",
      },
    });
  }
});