chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "showTranslation") {
    alert(`Translation: ${message.translation}`);
  }
});
