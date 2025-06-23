import { TranslationService } from './services/translationService.js';
// import dictionary from './data/dictionary.json' assert { type: 'json' };
import { DICTIONARY } from './data/dictionary.js';

const translationService = new TranslationService(DICTIONARY, 'es');

// Create the context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translate",
    title: "Translate Selected Text",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translate" && info.selectionText) {
    const {translation: translated} = translationService.translate(info.selectionText);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (translationResult) => {
        chrome.runtime.sendMessage({ action: "showTranslation", translationResult });
      },
      args: [translated]
    });
  }
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translate" && info.selectionText) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (selectedText) => {
        chrome.runtime.sendMessage({ action: "translate", text: selectedText });
      },
      args: [info.selectionText]
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "translate") {
    const {translation: translated} = translationService.translate(message.text);
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "showTranslation",
      translation: translated
    });
  }
});