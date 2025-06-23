// Background Service Worker for Pure Translator Extension
class TranslationEngine {
  constructor() {
    this.dictionary = new Map();
    this.patterns = new Map();
    this.cache = new Map();
    this.languageDetector = new LanguageDetector();
    this.initializeBaseDictionary();
    this.initializePatterns();
  }

  initializeBaseDictionary() {
    // Comprehensive dictionary with common words and phrases
    const baseDictionary = {
      'en-es': {
        // Basic words
        'hello': 'hola', 'goodbye': 'adiós', 'thank you': 'gracias', 'please': 'por favor',
        'yes': 'sí', 'no': 'no', 'water': 'agua', 'food': 'comida', 'house': 'casa',
        'car': 'coche', 'book': 'libro', 'time': 'tiempo', 'day': 'día', 'night': 'noche',
        'good': 'bueno', 'bad': 'malo', 'big': 'grande', 'small': 'pequeño',
        'happy': 'feliz', 'sad': 'triste', 'love': 'amor', 'friend': 'amigo',
        'family': 'familia', 'work': 'trabajo', 'school': 'escuela', 'money': 'dinero',
        'help': 'ayuda', 'beautiful': 'hermoso', 'important': 'importante',
        'difficult': 'difícil', 'easy': 'fácil', 'new': 'nuevo', 'old': 'viejo',
        // Common phrases
        'how are you': 'cómo estás', 'what is your name': 'cómo te llamas',
        'where is': 'dónde está', 'how much': 'cuánto cuesta', 'excuse me': 'disculpe',
        'i am': 'yo soy', 'you are': 'tú eres', 'he is': 'él es', 'she is': 'ella es',
        'good morning': 'buenos días', 'good afternoon': 'buenas tardes',
        'good evening': 'buenas noches', 'good night': 'buenas noches'
      },
      'en-fr': {
        // Basic words
        'hello': 'bonjour', 'goodbye': 'au revoir', 'thank you': 'merci',
        'please': 's\'il vous plaît', 'yes': 'oui', 'no': 'non', 'water': 'eau',
        'food': 'nourriture', 'house': 'maison', 'car': 'voiture', 'book': 'livre',
        'time': 'temps', 'day': 'jour', 'night': 'nuit', 'good': 'bon', 'bad': 'mauvais',
        'big': 'grand', 'small': 'petit', 'happy': 'heureux', 'sad': 'triste',
        'love': 'amour', 'friend': 'ami', 'family': 'famille', 'work': 'travail',
        'school': 'école', 'money': 'argent', 'help': 'aide', 'beautiful': 'beau',
        'important': 'important', 'difficult': 'difficile', 'easy': 'facile',
        // Common phrases
        'how are you': 'comment allez-vous', 'what is your name': 'quel est votre nom',
        'where is': 'où est', 'how much': 'combien coûte', 'excuse me': 'excusez-moi',
        'i am': 'je suis', 'you are': 'vous êtes', 'he is': 'il est', 'she is': 'elle est',
        'good morning': 'bonjour', 'good afternoon': 'bon après-midi',
        'good evening': 'bonsoir', 'good night': 'bonne nuit'
      },
      'en-de': {
        // Basic words
        'hello': 'hallo', 'goodbye': 'auf wiedersehen', 'thank you': 'danke',
        'please': 'bitte', 'yes': 'ja', 'no': 'nein', 'water': 'wasser',
        'food': 'essen', 'house': 'haus', 'car': 'auto', 'book': 'buch',
        'time': 'zeit', 'day': 'tag', 'night': 'nacht', 'good': 'gut', 'bad': 'schlecht',
        'big': 'groß', 'small': 'klein', 'happy': 'glücklich', 'sad': 'traurig',
        'love': 'liebe', 'friend': 'freund', 'family': 'familie', 'work': 'arbeit',
        'school': 'schule', 'money': 'geld', 'help': 'hilfe', 'beautiful': 'schön',
        'important': 'wichtig', 'difficult': 'schwierig', 'easy': 'einfach',
        // Common phrases
        'how are you': 'wie geht es dir', 'what is your name': 'wie heißt du',
        'where is': 'wo ist', 'how much': 'wie viel kostet', 'excuse me': 'entschuldigung',
        'i am': 'ich bin', 'you are': 'du bist', 'he is': 'er ist', 'she is': 'sie ist',
        'good morning': 'guten morgen', 'good afternoon': 'guten tag',
        'good evening': 'guten abend', 'good night': 'gute nacht'
      },
      'en-it': {
        'hello': 'ciao', 'goodbye': 'arrivederci', 'thank you': 'grazie',
        'please': 'per favore', 'yes': 'sì', 'no': 'no', 'water': 'acqua',
        'food': 'cibo', 'house': 'casa', 'car': 'macchina', 'book': 'libro',
        'good morning': 'buongiorno', 'good evening': 'buonasera',
        'how are you': 'come stai', 'excuse me': 'scusi'
      },
      'en-pt': {
        'hello': 'olá', 'goodbye': 'tchau', 'thank you': 'obrigado',
        'please': 'por favor', 'yes': 'sim', 'no': 'não', 'water': 'água',
        'food': 'comida', 'house': 'casa', 'car': 'carro', 'book': 'livro',
        'good morning': 'bom dia', 'good evening': 'boa noite',
        'how are you': 'como está', 'excuse me': 'com licença'
      }
    };

    // Add reverse mappings
    Object.keys(baseDictionary).forEach(langPair => {
      const [from, to] = langPair.split('-');
      const reverseKey = `${to}-${from}`;
      if (!baseDictionary[reverseKey]) {
        baseDictionary[reverseKey] = {};
        Object.keys(baseDictionary[langPair]).forEach(key => {
          baseDictionary[reverseKey][baseDictionary[langPair][key]] = key;
        });
      }
    });

    Object.keys(baseDictionary).forEach(langPair => {
      this.dictionary.set(langPair, baseDictionary[langPair]);
    });
  }

  initializePatterns() {
    // Grammar patterns and transformations
    const patterns = {
      'en-es': {
        // Suffix transformations
        'tion$': 'ción',
        'ly$': 'mente',
        'ity$': 'idad', 
        'ing$': 'ando',
        'ful$': 'lleno',
        // Prefix transformations
        '^un': 'des',
        '^re': 're',
        // Common patterns
        'I am': 'Yo soy',
        'you are': 'tú eres',
        'it is': 'es',
        'there is': 'hay',
        'there are': 'hay'
      },
      'en-fr': {
        'tion$': 'tion',
        'ly$': 'ment',
        'ity$': 'ité',
        'ing$': 'ant',
        '^un': 'dé',
        'I am': 'Je suis',
        'you are': 'vous êtes',
        'it is': 'c\'est',
        'there is': 'il y a',
        'there are': 'il y a'
      },
      'en-de': {
        'tion$': 'tion',
        'ly$': 'lich',
        'ity$': 'ität',
        'ing$': 'end',
        'I am': 'Ich bin',
        'you are': 'du bist',
        'it is': 'es ist',
        'there is': 'es gibt',
        'there are': 'es gibt'
      }
    };

    Object.keys(patterns).forEach(langPair => {
      this.patterns.set(langPair, patterns[langPair]);
    });
  }

  async translate(text, fromLang = 'auto', toLang = 'en') {
    try {
      if (!text || text.trim() === '') {
        return { translation: '', confidence: 0, detected: fromLang };
      }

      const cleanText = text.toLowerCase().trim();
      const cacheKey = `${fromLang}-${toLang}-${cleanText}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Auto-detect language if needed
      if (fromLang === 'auto') {
        fromLang = this.languageDetector.detectLanguage(text);
      }

      // Don't translate if source and target are the same
      if (fromLang === toLang) {
        return { translation: text, confidence: 1, detected: fromLang };
      }

      const langPair = `${fromLang}-${toLang}`;
      let translation = '';
      let confidence = 0;

      // Try direct dictionary lookup first
      if (this.dictionary.has(langPair)) {
        const dict = this.dictionary.get(langPair);
        
        // Check for exact phrase match
        if (dict[cleanText]) {
          translation = dict[cleanText];
          confidence = 0.95;
        } else {
          // Try word-by-word translation
          const result = this.translateWordsAndPhrases(text, dict);
          translation = result.translation;
          confidence = result.confidence;
        }
      }

      // Apply pattern transformations if available
      if (!translation || confidence < 0.3) {
        const patternResult = this.applyPatterns(text, langPair);
        if (patternResult.confidence > confidence) {
          translation = patternResult.translation;
          confidence = patternResult.confidence;
        }
      }

      // Fallback to morphological analysis
      if (!translation || confidence < 0.2) {
        translation = this.morphologicalTranslation(text, fromLang, toLang);
        confidence = 0.3;
      }

      // Final fallback - return original text
      if (!translation) {
        translation = text;
        confidence = 0;
      }

      const result = {
        translation: this.capitalizeText(translation, text),
        confidence: Math.min(confidence, 1),
        detected: fromLang,
        originalText: text
      };

      // Cache the result
      this.cache.set(cacheKey, result);
      
      // Limit cache size
      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      return result;

    } catch (error) {
      console.error('Translation error:', error);
      return {
        translation: text,
        confidence: 0,
        detected: fromLang,
        error: error.message
      };
    }
  }

  translateWordsAndPhrases(text, dictionary) {
    const words = text.split(/\s+/);
    const translatedWords = [];
    let matchedWords = 0;
    let totalWords = words.length;

    // First pass: try to find multi-word phrases
    let i = 0;
    while (i < words.length) {
      let found = false;
      
      // Try phrases of decreasing length (up to 5 words)
      for (let phraseLength = Math.min(5, words.length - i); phraseLength > 1; phraseLength--) {
        const phrase = words.slice(i, i + phraseLength).join(' ').toLowerCase();
        if (dictionary[phrase]) {
          translatedWords.push(dictionary[phrase]);
          matchedWords += phraseLength;
          i += phraseLength;
          found = true;
          break;
        }
      }
      
      // If no phrase found, try single word
      if (!found) {
        const word = words[i].toLowerCase().replace(/[^\w]/g, '');
        if (dictionary[word]) {
          translatedWords.push(dictionary[word]);
          matchedWords++;
        } else {
          // Try partial matches
          let partialMatch = this.findPartialMatch(word, dictionary);
          if (partialMatch) {
            translatedWords.push(partialMatch);
            matchedWords += 0.5;
          } else {
            translatedWords.push(words[i]);
          }
        }
        i++;
      }
    }

    return {
      translation: translatedWords.join(' '),
      confidence: matchedWords / totalWords
    };
  }

  findPartialMatch(word, dictionary) {
    // Find words that contain or are contained in the target word
    const entries = Object.keys(dictionary);
    
    // Exact substring matches
    for (const entry of entries) {
      if (entry.includes(word) || word.includes(entry)) {
        if (Math.abs(entry.length - word.length) <= 2) {
          return dictionary[entry];
        }
      }
    }
    
    // Fuzzy matching based on common prefixes/suffixes
    for (const entry of entries) {
      if (this.calculateSimilarity(word, entry) > 0.7) {
        return dictionary[entry];
      }
    }
    
    return null;
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  applyPatterns(text, langPair) {
    if (!this.patterns.has(langPair)) {
      return { translation: '', confidence: 0 };
    }

    const patterns = this.patterns.get(langPair);
    let result = text;
    let transformations = 0;
    let totalPatterns = Object.keys(patterns).length;

    Object.keys(patterns).forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = result.match(regex);
      if (matches) {
        result = result.replace(regex, patterns[pattern]);
        transformations += matches.length;
      }
    });

    return {
      translation: result,
      confidence: Math.min(transformations / Math.max(text.split(' ').length, 1), 0.8)
    };
  }

  morphologicalTranslation(text, fromLang, toLang) {
    // Basic morphological transformation rules
    const morphRules = {
      'en-es': {
        suffixes: {
          'ing': 'ando',
          'ed': 'ado',
          'er': 'dor',
          'est': 'ísimo',
          's': 's'
        }
      },
      'en-fr': {
        suffixes: {
          'ing': 'ant',
          'ed': 'é',
          'er': 'eur',
          'est': 'le plus',
          's': 's'
        }
      },
      'en-de': {
        suffixes: {
          'ing': 'end',
          'ed': 'te',
          'er': 'er',
          'est': 'ste',
          's': 'e'
        }
      }
    };

    const rules = morphRules[`${fromLang}-${toLang}`];
    if (!rules) return text;

    let result = text;
    Object.keys(rules.suffixes).forEach(suffix => {
      const regex = new RegExp(`\\b(\\w+)${suffix}\\b`, 'gi');
      result = result.replace(regex, (match, stem) => {
        return stem + rules.suffixes[suffix];
      });
    });

    return result;
  }

  capitalizeText(translation, originalText) {
    // Match capitalization pattern of original text
    if (!translation) return translation;
    
    if (originalText === originalText.toUpperCase()) {
      return translation.toUpperCase();
    }
    
    if (originalText === originalText.toLowerCase()) {
      return translation.toLowerCase();
    }
    
    // Capitalize first letter if original was capitalized
    if (originalText.charAt(0) === originalText.charAt(0).toUpperCase()) {
      return translation.charAt(0).toUpperCase() + translation.slice(1);
    }
    
    return translation;
  }

  addToDictionary(word, translation, fromLang, toLang) {
    const langPair = `${fromLang}-${toLang}`;
    if (!this.dictionary.has(langPair)) {
      this.dictionary.set(langPair, {});
    }
    
    const dict = this.dictionary.get(langPair);
    dict[word.toLowerCase()] = translation.toLowerCase();
    
    // Clear cache to reflect new dictionary entries
    this.cache.clear();
  }

  getSupportedLanguages() {
    return {
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
  }
}

class LanguageDetector {
  constructor() {
    this.languagePatterns = {
      'es': {
        chars: /[ñáéíóúü¿¡]/i,
        words: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las', 'una', 'está', 'como', 'más', 'pero', 'sus', 'ha', 'muy', 'hasta', 'desde', 'cuando', 'ellos', 'ellas', 'nosotros'],
        score: 0
      },
      'fr': {
        chars: /[àâäéèêëïîôöùûüÿç]/i,
        words: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'en', 'mais', 'du', 'au', 'nous', 'vous', 'ils', 'elles'],
        score: 0
      },
      'de': {
        chars: /[äöüß]/i,
        words: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als', 'auch', 'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass', 'sie', 'nach', 'wird', 'bei', 'einer', 'um', 'am', 'sind', 'noch', 'wie', 'einem', 'über', 'einen', 'so', 'zum', 'war', 'haben', 'nur', 'oder', 'aber', 'vor', 'zur', 'bis'],
        score: 0
      },
      'it': {
        chars: /[àèéìíîòóù]/i,
        words: ['il', 'di', 'che', 'e', 'la', 'a', 'un', 'in', 'per', 'è', 'con', 'non', 'da', 'una', 'su', 'sono', 'si', 'come', 'lo', 'ma', 'se', 'del', 'o', 'alla', 'le', 'nel', 'dell', 'quando', 'anche', 'questo'],
        score: 0
      },
      'pt': {
        chars: /[ãâáàêéçõôó]/i,
        words: ['o', 'de', 'a', 'e', 'que', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'ao', 'ele', 'das', 'à', 'seu', 'sua'],
        score: 0
      },
      'ru': {
        chars: /[абвгдеёжзийклмнопрстуфхцчшщъыьэюя]/i,
        words: ['в', 'и', 'не', 'на', 'я', 'быть', 'он', 'с', 'что', 'а', 'по', 'это', 'она', 'этот', 'к', 'но', 'они', 'мы', 'как', 'из', 'у', 'который', 'то', 'за', 'свой', 'что', 'её', 'так', 'ещё', 'бы'],
        score: 0
      },
      'zh': {
        chars: /[\u4e00-\u9fff]/,
        words: ['的', '一', '是', '在', '不', '了', '有', '和', '人', '这', '中', '大', '为', '上', '个', '国', '我', '以', '要', '他', '时', '来', '用', '们', '生', '到', '作', '地', '于', '出'],
        score: 0
      },
      'ja': {
        chars: /[\u3040-\u309f\u30a0-\u30ff]/,
        words: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として', 'い', 'や', 'れる', 'など', 'なっ', 'ない', 'この', 'ため', 'その', 'あっ'],
        score: 0
      },
      'ko': {
        chars: /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/,
        words: ['이', '의', '가', '을', '는', '에', '있', '하', '것', '들', '그', '되', '수', '이', '보', '않', '없', '나', '사람', '주', '아니', '등', '같', '우리', '때', '년', '가', '한국', '데', '게'],
        score: 0
      },
      'ar': {
        chars: /[\u0600-\u06ff]/,
        words: ['في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'التي', 'الذي', 'ذلك', 'تلك', 'كان', 'كانت', 'يكون', 'تكون', 'له', 'لها', 'منه', 'منها', 'عنه', 'عنها', 'معه', 'معها', 'إليه', 'إليها', 'فيه', 'فيها', 'عليه', 'عليها', 'لهم', 'لهن'],
        score: 0
      }
    };
  }

  detectLanguage(text) {
    if (!text || text.trim().length === 0) return 'en';
    
    const cleanText = text.toLowerCase().trim();
    const words = cleanText.split(/\s+/);
    
    // Reset scores
    Object.keys(this.languagePatterns).forEach(lang => {
      this.languagePatterns[lang].score = 0;
    });

    // Score based on character patterns
    Object.keys(this.languagePatterns).forEach(lang => {
      const pattern = this.languagePatterns[lang];
      if (pattern.chars.test(text)) {
        const matches = text.match(pattern.chars);
        pattern.score += (matches ? matches.length : 0) * 3;
      }
    });

    // Score based on common words
    Object.keys(this.languagePatterns).forEach(lang => {
      const pattern = this.languagePatterns[lang];
      let wordMatches = 0;
      
      words.forEach(word => {
        if (pattern.words.includes(word)) {
          wordMatches++;
        }
      });
      
      pattern.score += wordMatches * 2;
    });

    // Find language with highest score
    let detectedLang = 'en';
    let maxScore = 0;
    
    Object.keys(this.languagePatterns).forEach(lang => {
      if (this.languagePatterns[lang].score > maxScore) {
        maxScore = this.languagePatterns[lang].score;
        detectedLang = lang;
      }
    });

    // If no clear winner, default to English
    return maxScore > 0 ? detectedLang : 'en';
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
    console.log('Pure Translator Extension initialized');
  }

  createContextMenus() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'translate-selection',
        title: 'Translate "%s"',
        contexts: ['selection']
      });

      chrome.contextMenus.create({
        id: 'translate-page',
        title: 'Translate entire page',
        contexts: ['page']
      });

      // Language-specific menus
      const languages = [
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'en', name: 'English' }
      ];

      languages.forEach(lang => {
        chrome.contextMenus.create({
          id: `translate-to-${lang.code}`,
          title: `Translate to ${lang.name}`,
          contexts: ['selection'],
          parentId: 'translate-selection'
        });
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
        case 'translate':
          const result = await this.translationEngine.translate(
            request.text,
            request.fromLang || 'auto',
            request.toLang || 'en'
          );
          await this.saveToHistory(request.text, result);
          sendResponse({ success: true, result });
          break;

        case 'detectLanguage':
          const detected = this.translationEngine.languageDetector.detectLanguage(request.text);
          sendResponse({ success: true, language: detected });
          break;

        case 'getSupportedLanguages':
          const languages = this.translationEngine.getSupportedLanguages();
          sendResponse({ success: true, languages });
          break;

        case 'addToDictionary':
          this.translationEngine.addToDictionary(
            request.word,
            request.translation,
            request.fromLang,
            request.toLang
          );
          sendResponse({ success: true });
          break;

        case 'getTranslationHistory':
          const history = await this.getTranslationHistory();
          sendResponse({ success: true, history });
          break;

        case 'clearHistory':
          await this.clearTranslationHistory();
          sendResponse({ success: true });
          break;

        case 'updateSettings':
          await this.updateSettings(request.settings);
          sendResponse({ success: true });
          break;

        case 'getSettings':
          const settings = await this.getSettings();
          sendResponse({ success: true, settings });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async saveToHistory(originalText, result) {
    try {
      const historyItem = {
        id: Date.now().toString(),
        originalText,
        translatedText: result.translation,
        fromLang: result.detected,
        toLang: 'en', // This should be dynamic based on request
        confidence: result.confidence,
        timestamp: new Date().toISOString(),
        url: 'extension' // Will be updated by content script
      };

      const { translationHistory = [] } = await chrome.storage.local.get('translationHistory');
      translationHistory.unshift(historyItem);
      
      if (translationHistory.length > 100) {
        translationHistory.splice(100);
      }

      await chrome.storage.local.set({ translationHistory });
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }

  async getTranslationHistory() {
    try {
      const { translationHistory = [] } = await chrome.storage.local.get('translationHistory');
      return translationHistory;
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  async clearTranslationHistory() {
    try {
      await chrome.storage.local.remove('translationHistory');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  async getSettings() {
    try {
      const defaultSettings = {
        autoDetectLanguage: true,
        showConfidence: true,
        enableContextMenu: true,
        defaultTargetLanguage: 'en',
        enablePageTranslation: true,
        saveHistory: true,
        enableHoverTranslation: false,
        translationSpeed: 'normal'
      };

      const { userSettings = {} } = await chrome.storage.sync.get('userSettings');
      return { ...defaultSettings, ...userSettings };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  }

  async updateSettings(newSettings) {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };
      
      await chrome.storage.sync.set({ userSettings: updatedSettings });
      this.onSettingsChanged(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }

  setupStorageListeners() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes.userSettings) {
        this.onSettingsChanged(changes.userSettings.newValue);
      }
    });
  }

  onSettingsChanged(settings) {
    if (settings.enableContextMenu === false) {
      chrome.contextMenus.removeAll();
    } else {
      this.createContextMenus();
    }
  }
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const targetLangMap = {
    'translate-to-spanish': 'es',
    'translate-to-french': 'fr',
    'translate-to-german': 'de',
    'translate-to-english': 'en'
  };

  if (info.menuItemId === 'translate-page') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'translatePage'
    });
  } else if (targetLangMap[info.menuItemId]) {
    const toLang = targetLangMap[info.menuItemId];
    
    chrome.tabs.sendMessage(tab.id, {
      action: 'showTranslation',
      text: info.selectionText,
      toLang: toLang
    });
  }
});

// Initialize background service
const extensionBackground = new ExtensionBackground();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      userSettings: {
        autoDetectLanguage: true,
        enableContextMenu: true,
        defaultTargetLanguage: 'en',
        saveHistory: true
      }
    });
  }
});