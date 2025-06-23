(async () => {
  const selectedText = window.getSelection().toString().trim();
  if (!selectedText) return;

  const module = await import(chrome.runtime.getURL('translation.js'));
  const translation = module.translateText(selectedText);

  alert(`Original : ${selectedText}\nTranslated : ${translation}`);
})();
