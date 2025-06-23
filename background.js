chrome.runtime.onInstalled.addListener(() => {
  console.log("[Background] Extension installed. Creating context menu.");
  chrome.contextMenus.create({
    id: "translate",
    title: "Translate Selected Text",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translate" && info.selectionText) {
    console.log(`[Background] Translating text: "${info.selectionText}" in TabId: ${tab.id}`);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  }
});
