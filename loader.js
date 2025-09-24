(function() {
  const STORAGE_KEY = 'figma_json_text';

  function getEl(id) { return document.getElementById(id); }

  function setTextarea(value) {
    const textarea = getEl('json-input');
    if (textarea) textarea.value = value;
  }

  function getTextarea() {
    const textarea = getEl('json-input');
    return textarea ? textarea.value : '';
  }

  function saveToStorage(text) {
    try { localStorage.setItem(STORAGE_KEY, text); } catch (_) {}
  }

  function loadFromStorage() {
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch (_) { return ''; }
  }

  function clearViewport() {
    const viewport = getEl('viewport');
    if (!viewport) return;
    while (viewport.firstChild) viewport.removeChild(viewport.firstChild);
  }

  function renderJsonText(jsonText) {
    if (!jsonText) return;
    try {
      const data = JSON.parse(jsonText);
      const viewport = getEl('viewport');
      if (!viewport) return;
      window.FIGMA_DATA = data;
      const imageMap = window.IMAGE_MAP || {};
      window.renderFigmaTo(viewport, data, { imageMap });
    } catch (err) {
      console.error('Failed to parse JSON:', err);
      alert('Invalid JSON. Please check your data.');
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    const fileInput = getEl('file-input');
    const renderBtn = getEl('render-btn');
    const clearBtn = getEl('clear-btn');

    // Pre-populate textarea
    if (window.FIGMA_DATA) {
      try { setTextarea(JSON.stringify(window.FIGMA_DATA, null, 2)); } catch (_) {}
    } else {
      const saved = loadFromStorage();
      if (saved) setTextarea(saved);
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target && e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const text = String(reader.result || '');
          setTextarea(text);
          saveToStorage(text);
          renderJsonText(text);
        };
        reader.readAsText(file);
      });
    }

    if (renderBtn) {
      renderBtn.addEventListener('click', () => {
        const text = getTextarea();
        saveToStorage(text);
        clearViewport();
        renderJsonText(text);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        setTextarea('');
        saveToStorage('');
        clearViewport();
      });
    }
  });
})();

