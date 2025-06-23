export function showTooltip(text) {
  console.log('[Tooltip] showTooltip called with text:', text);

  const existingTooltip = document.getElementById('translation-tooltip');
  if (existingTooltip) {
    console.log('[Tooltip] Existing tooltip found, removing it.');
    existingTooltip.remove();
  }

  const tooltip = document.createElement('div');
  tooltip.id = 'translation-tooltip';
  tooltip.textContent = text;

  document.body.appendChild(tooltip);
  console.log('[Tooltip] Tooltip element appended to the document.');

  requestAnimationFrame(() => {
    tooltip.classList.add('visible');
    console.log('[Tooltip] Tooltip made visible.');
  });

  setTimeout(() => {
    tooltip.classList.remove('visible');
    console.log('[Tooltip] Tooltip visibility removed, starting removal timer.');

    setTimeout(() => {
      tooltip.remove();
      console.log('[Tooltip] Tooltip element removed from the document.');
    }, 300);
  }, 5000);
}
