import { TranslationService } from './services/translationService.js';
// import dictionary from './data/dictionary.json' assert { type: 'json' };
import { DICTIONARY } from './data/dictionary.js';

let translationService;
let currentLang = 'es';

// Initialize with saved lang or default
async function initTranslationService() {
  try {
    const storage = await chrome.storage.local.get({ targetLang: 'es' });
    currentLang = storage.targetLang;
    translationService = new TranslationService(DICTIONARY, currentLang);
    console.log(`[Background] Initialized translation service with lang: ${currentLang}`);
  } catch (err) {
    console.error('[Background] Failed to init translation service', err);
    currentLang = 'es';
    translationService = new TranslationService(DICTIONARY, 'es');
  }
}

// Monitor storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.targetLang) {
    const newLang = changes.targetLang.newValue;
    console.log(`[Background] targetLang changed to: ${newLang}`);
    currentLang = newLang;
    translationService = new TranslationService(DICTIONARY, currentLang);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] Installed');
  chrome.contextMenus.create({
    id: 'translate',
    title: 'Translate Selected Text',
    contexts: ['selection']
  });
  initTranslationService();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translate' && info.selectionText) {
    console.log(`[Background] Translate clicked: "${info.selectionText}"`);
    enqueueRequest({ text: info.selectionText, tabId: tab.id });
  }
});

const requestQueue = [];
let processing = false;

function enqueueRequest(req) {
  requestQueue.push(req);
  console.log(`[Background] Enqueued request: "${req.text}"`);
  processQueue();
}

async function processQueue() {
  if (processing || requestQueue.length === 0) return;
  processing = true;

  while (requestQueue.length > 0) {
    const { text, tabId } = requestQueue.shift();
    console.log(`[Background] Processing: "${text}"`);

    try {
      const translated = await simulateTranslation(text);
      chrome.tabs.sendMessage(tabId, {
        action: 'showTranslation',
        translationResult: translated
      });
      console.log(`[Background] Sent translation to tab ${tabId}: "${translated}"`);
    } catch (err) {
      console.error('[Background] Error processing request:', err);
    }
  }

  processing = false;
  console.log('[Background] Done processing queue');
}

function simulateTranslation(text) {
  return new Promise(resolve => {
    console.log(`[Background] Simulating translation: "${text}"`);
    setTimeout(() => {
      const result = translationService.translate(text);
      console.log(`[Background] Simulated result: "${result}"`);
      resolve(result);
    }, 100);
  });
}
