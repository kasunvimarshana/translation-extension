import { TranslationService } from './services/translationService.js';
// import dictionary from './data/dictionary.json' assert { type: 'json' };
import { DICTIONARY } from './data/dictionary.js';

// Service instance
const translationService = new TranslationService(DICTIONARY, 'es');

// Maintain a queue for long-running requests
const requestQueue = [];
let processing = false;

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] Extension installed, creating context menu.');
  chrome.contextMenus.create({
    id: 'translate',
    title: 'Translate Selected Text',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translate' && info.selectionText) {
    console.log(
      `[Background] Context menu clicked, enqueueing text: "${info.selectionText}" for tabId: ${tab.id}`
    );
    enqueueRequest({ text: info.selectionText, tabId: tab.id });
  }
});

function enqueueRequest(request) {
  console.log(`[Background] Enqueueing request: "${request.text}"`);
  requestQueue.push(request);
  processQueue();
}

async function processQueue() {
  if (processing) {
    console.log('[Background] Already processing queue, skipping.');
    return;
  }
  if (requestQueue.length === 0) {
    console.log('[Background] Request queue empty, nothing to process.');
    return;
  }

  console.log('[Background] Starting to process request queue.');
  processing = true;

  while (requestQueue.length > 0) {
    const { text, tabId } = requestQueue.shift();
    console.log(`[Background] Processing text: "${text}" for tabId: ${tabId}`);

    try {
      const result = await longRunningTranslate(text);
      console.log(
        `[Background] Translation result: "${result}" for tabId: ${tabId}`
      );
      
      chrome.tabs.sendMessage(tabId, {
        action: 'showTranslation',
        translationResult: result,
      });
    } catch (error) {
      console.error('[Background] Error processing translation:', error);
    }
  }

  console.log('[Background] Finished processing request queue.');
  processing = false;
}

function longRunningTranslate(text) {
  return new Promise((resolve) => {
    console.log(
      `[Background] Simulating async translation for text: "${text}"`
    );
    setTimeout(() => {
      const result = translationService.translate(text);
      console.log(`[Background] Simulated translation complete: "${result}"`);
      resolve(result);
    }, 100);
  });
}
