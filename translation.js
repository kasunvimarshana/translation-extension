export const DICTIONARY = {
  "hello": "hola",
  "good morning": "buenos días",
  "good night": "buenas noches",
  "thank you": "gracias"
};

export function translateText(text) {
  const lower = text.trim().toLowerCase();
  return DICTIONARY[lower] || "[no translation available]";
}
