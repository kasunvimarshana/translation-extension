async function loadOptions() {
  try {
    const storage = await chrome.storage.local.get({ targetLang: 'es' }); 
    console.log(`[Options] Loaded targetLang: ${storage.targetLang}`);
    document.getElementById('targetLang').value = storage.targetLang;
  } catch (error) {
    console.error('[Options] Failed to load target language', error);
  }
}

async function saveOptions() {
  const targetLang = document.getElementById('targetLang').value;
  try {
    await chrome.storage.local.set({ targetLang }); 
    console.log(`[Options] Saved target language: ${targetLang}`);
    alert('Options saved!');
  } catch (error) {
    console.error('[Options] Failed to save target language', error);
    alert('Error saving options!');
  }
}

document.getElementById('save').addEventListener('click', saveOptions);
loadOptions();
