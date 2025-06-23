// Store the last selected text
let selectedText = '';

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translate-text",
    title: "Translate with LocalTranslate",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translate-text" && info.selectionText) {
    selectedText = info.selectionText;
    
    // Open the extension popup
    chrome.action.openPopup();
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    sendResponse({ text: selectedText });
    selectedText = ''; // Clear after sending
  }
});

// Handle hotkey command
chrome.commands.onCommand.addListener((command) => {
  if (command === "_execute_action") {
    // Get selected text from active tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "getSelection"}, (response) => {
          if (response && response.selection) {
            selectedText = response.selection;
            chrome.action.openPopup();
          }
        });
      }
    });
  }
});