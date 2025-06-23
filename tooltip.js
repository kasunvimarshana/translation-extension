export function showTooltip(text) {
  const existingTooltip = document.getElementById('translation-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }

  const tooltip = document.createElement('div');
  tooltip.id = 'translation-tooltip';
  tooltip.textContent = text;

  document.body.appendChild(tooltip);
  setTimeout(() => {
    tooltip.classList.add('visible');
  }, 10);

  // Auto remove after 5 seconds
  setTimeout(() => tooltip.remove(), 5000);
}
