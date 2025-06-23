export class TranslationService {
  constructor() {
    this.dictionary = {
      "hello": "hola",
      "world": "mundo",
      "good": "bueno",
      "morning": "mañana",
      "evening": "tarde",
      "user": "usuario",
      "chat": "charla"
    };
  }

  translate(text, targetLang = "es") {
    if (!text) return '';
    const words = text.toLowerCase().split(/\s+/);
    return words.map(word => this.dictionary[word] || word).join(" ");
  }
}

export const translationService = new TranslationService();
