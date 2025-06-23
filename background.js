import { translationService } from './services/translationService.js';

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
//     const translatedText = translationService.translate(info.selectionText);
//     chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       func: (translation) => {
//         chrome.runtime.sendMessage({ action: "showTranslation", translation });
//       },
//       args: [translatedText]
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
    const translated = translationService.translate(message.text);
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "showTranslation",
      translation: translated
    });
  }
});
