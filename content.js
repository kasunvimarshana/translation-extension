chrome.runtime.onMessage.addListener((message) => {
  console.log('[Content] Received message:', message);

  if (message.action === "showTranslation") {
    console.log('[Content] Action is showTranslation, loading tooltip module...');

    import(chrome.runtime.getURL('tooltip.js'))
      .then(module => {
        console.log('[Content] Tooltip module loaded.');

        const { translationResult } = message;
        const text = `${translationResult?.translation ?? ''} (confidence: ${translationResult?.confidence ?? 'N/A'})`;

        console.log('[Content] Showing tooltip with text:', text);
        module.showTooltip(text);
      })
      .catch(error => {
        console.error('[Content] Failed to load tooltip module:', error);
      });
  } else {
    console.log('[Content] Received unknown action:', message.action);
  }
});
