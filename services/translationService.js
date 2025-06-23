export class TranslationService {
  constructor(dictionary, targetLang = 'es') {
    this.dictionary = dictionary;
    this.targetLang = targetLang;
    this.cache = new Map();
  }

  translate(text, sourceLang = 'en') {
    if (!text) {
      return { translation: text, sourceLang, targetLang: this.targetLang, confidence: 1.0 };
    }

    const normalized = text.trim().toLowerCase();
    const cacheKey = `${sourceLang}:${this.targetLang}:${normalized}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const sourceWords = this.dictionary[sourceLang];
    const targetWords = this.dictionary[this.targetLang];
    if (!sourceWords || !targetWords) {
      const result = { translation: text, sourceLang, targetLang: this.targetLang, confidence: 0.0 };
      this.cache.set(cacheKey, result);
      return result;
    }

    const translation = targetWords[normalized];
    const result = {
      translation: translation || text,
      sourceLang,
      targetLang: this.targetLang,
      confidence: translation ? 1.0 : 0.5
    };
    this.cache.set(cacheKey, result);
    return result;
  }
}
