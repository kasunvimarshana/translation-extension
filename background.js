import { TranslationService } from './services/translationService.js';
import { API_KEY } from './config.js';

const translationService = new TranslationService(API_KEY, 'es');

// Create the context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translate",
    title: "Translate Selected Text",
    contexts: ["selection"]
  });
});

// // Handle context menu click
// chrome.contextMenus.onClicked.addListener((info, tab) => {
//   if (info.menuItemId === "translate" && info.selectionText) {
//     translationService.translate(info.selectionText).then(translated => {
//       chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         func: (translation) => {
//           chrome.runtime.sendMessage({ action: "showTranslation", translation });
//         },
//         args: [translated]
//       });
//     });
//   }
// });

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
    translationService.translate(message.text).then(translated => {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "showTranslation",
        translation: translated
      });
    });
  }
});