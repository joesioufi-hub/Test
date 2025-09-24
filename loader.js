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
    const figmaFetchBtn = getEl('figma-fetch-btn');
    const figmaFileKeyEl = getEl('figma-file-key');
    const figmaTokenEl = getEl('figma-token');

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

    if (figmaFetchBtn) {
      figmaFetchBtn.addEventListener('click', async () => {
        const fileKey = figmaFileKeyEl && figmaFileKeyEl.value.trim();
        const token = figmaTokenEl && figmaTokenEl.value.trim();
        if (!fileKey || !token) {
          alert('Please enter both File Key and Personal Access Token.');
          return;
        }
        try {
          const res = await fetch(`https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}`, {
            headers: {
              'X-Figma-Token': token
            }
          });
          if (!res.ok) {
            throw new Error(`Request failed (${res.status})`);
          }
          const json = await res.json();
          // Find the first FRAME in the document to render
          const doc = json && json.document;
          if (!doc) throw new Error('Invalid response: no document');

          function findFirstFrame(node) {
            if (!node) return null;
            if (node.type === 'FRAME') return node;
            const children = node.children || [];
            for (let i = 0; i < children.length; i += 1) {
              const found = findFirstFrame(children[i]);
              if (found) return found;
            }
            return null;
          }

          const firstFrame = findFirstFrame(doc);
          if (!firstFrame) throw new Error('No FRAME found in file');
          const text = JSON.stringify(firstFrame, null, 2);
          setTextarea(text);
          saveToStorage(text);
          clearViewport();
          renderJsonText(text);
        } catch (err) {
          console.error(err);
          alert('Failed to fetch from Figma. Check key/token or CORS restrictions.');
        }
      });
    }
  });
})();

