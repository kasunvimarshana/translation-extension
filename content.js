chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "showTranslation") {
    import(chrome.runtime.getURL('tooltip.js')).then((module) => {
      module.showTooltip(message.translation);
    });
  }
});
