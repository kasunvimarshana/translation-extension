export class TranslationService {
  constructor(apiKey, targetLang = 'es') {
    this.apiKey = apiKey;
    this.targetLang = targetLang;
    this.cache = {};
  }

  async translate(text) {
    if (!text) return '';
    if (this.cache[text]) {
      return this.cache[text];
    }

    try {
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: text, target: this.targetLang, format: 'text' })
      });
      const data = await response.json();

      if (data?.data?.translations?.[0]?.translatedText) {
        const translation = data.data.translations[0].translatedText;
        this.cache[text] = translation;
        return translation;
      } else {
        console.error('Google Translate error:', data);
        return text;
      }
    } catch (error) {
      console.error(error);
      return text;
    }
  }
}
