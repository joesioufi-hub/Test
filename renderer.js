(function() {
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  function colorToCss(color, opacityOverride) {
    if (!color) return 'transparent';
    const r = Math.round(clamp01(color.r) * 255);
    const g = Math.round(clamp01(color.g) * 255);
    const b = Math.round(clamp01(color.b) * 255);
    const a = opacityOverride != null ? opacityOverride : (color.a != null ? clamp01(color.a) : 1);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function getBounds(node) {
    if (node.absoluteBoundingBox) {
      return {
        x: node.absoluteBoundingBox.x || 0,
        y: node.absoluteBoundingBox.y || 0,
        width: node.absoluteBoundingBox.width || node.width || 0,
        height: node.absoluteBoundingBox.height || node.height || 0
      };
    }
    return {
      x: node.x || 0,
      y: node.y || 0,
      width: node.width || 0,
      height: node.height || 0
    };
  }

  function applyCornerRadii(el, node) {
    const radii = node.rectangleCornerRadii || node.cornerRadii;
    const all = node.cornerRadius;
    if (Array.isArray(radii) && radii.length === 4) {
      el.style.borderTopLeftRadius = `${radii[0]}px`;
      el.style.borderTopRightRadius = `${radii[1]}px`;
      el.style.borderBottomRightRadius = `${radii[2]}px`;
      el.style.borderBottomLeftRadius = `${radii[3]}px`;
    } else if (typeof all === 'number' && isFinite(all) && all > 0) {
      el.style.borderRadius = `${all}px`;
    }
  }

  function extractSolidPaintColor(paint, nodeOpacity) {
    if (!paint || paint.type !== 'SOLID' || paint.visible === false) return null;
    const a = paint.opacity != null ? paint.opacity : 1;
    const effectiveA = nodeOpacity != null ? (a * nodeOpacity) : a;
    return colorToCss(paint.color, effectiveA);
  }

  function applyFills(el, node, imageMap) {
    const nodeOpacity = node.opacity != null ? node.opacity : 1;
    const fills = node.fills || [];
    const visibleFills = Array.isArray(fills) ? fills.filter(f => f.visible !== false) : [];
    if (visibleFills.length === 0) return;

    // Prefer the top-most visible paint
    const topPaint = visibleFills[visibleFills.length - 1];
    if (topPaint.type === 'SOLID') {
      const bg = extractSolidPaintColor(topPaint, nodeOpacity);
      if (bg) el.style.backgroundColor = bg;
    } else if (topPaint.type === 'IMAGE') {
      const hash = topPaint.imageHash || (topPaint.imageRef || topPaint.ref);
      const src = (hash && imageMap && imageMap[hash]) ? imageMap[hash] : null;
      if (src) {
        el.classList.add('image-fill');
        el.style.backgroundImage = `url("${src}")`;
      }
      // If no mapping exists, leave it blank; user can supply IMAGE_MAP
    } else if (topPaint.type === 'GRADIENT_LINEAR' && topPaint.gradientStops) {
      // Minimal linear gradient support
      const stops = topPaint.gradientStops
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map(stop => {
          const c = colorToCss(stop.color, (stop.color && stop.color.a != null ? stop.color.a : 1) * nodeOpacity);
          const p = Math.round((stop.position || 0) * 100);
          return `${c} ${p}%`;
        })
        .join(', ');
      el.style.backgroundImage = `linear-gradient(90deg, ${stops})`;
    }
  }

  function applyStrokes(el, node) {
    const strokes = node.strokes || [];
    const strokeWeight = node.strokeWeight || (node.strokeWeights && node.strokeWeights[0]) || 0;
    const visibleStrokes = Array.isArray(strokes) ? strokes.filter(s => s.visible !== false) : [];
    if (visibleStrokes.length === 0 || !strokeWeight) return;
    const top = visibleStrokes[visibleStrokes.length - 1];
    if (top.type === 'SOLID') {
      const color = extractSolidPaintColor(top, node.opacity != null ? node.opacity : 1);
      if (color) {
        el.style.border = `${strokeWeight}px solid ${color}`;
      }
    }
  }

  function applyRotation(el, node) {
    if (typeof node.rotation === 'number' && node.rotation !== 0) {
      el.style.transform = `rotate(${node.rotation}deg)`;
    }
  }

  function applyCommon(el, node) {
    if (node.opacity != null && node.opacity !== 1) {
      el.style.opacity = String(node.opacity);
    }
    if (node.clipsContent) {
      el.style.overflow = 'hidden';
    }
  }

  function applyTextStyles(el, node) {
    const style = node.style || {};
    if (style.fontSize) el.style.fontSize = `${style.fontSize}px`;
    if (style.fontWeight) el.style.fontWeight = String(style.fontWeight);
    if (style.letterSpacing) el.style.letterSpacing = `${style.letterSpacing}px`;
    if (style.lineHeightPx) el.style.lineHeight = `${style.lineHeightPx}px`;
    if (style.textAlignHorizontal) el.style.textAlign = style.textAlignHorizontal.toLowerCase();
    if (style.fontFamily) el.style.fontFamily = style.fontFamily;

    // Prefer text fill color from fills on TEXT node
    const fills = node.fills || [];
    const visibleFills = Array.isArray(fills) ? fills.filter(f => f.visible !== false) : [];
    if (visibleFills.length) {
      const top = visibleFills[visibleFills.length - 1];
      if (top.type === 'SOLID') {
        const c = extractSolidPaintColor(top, node.opacity != null ? node.opacity : 1);
        if (c) el.style.color = c;
      }
    }
  }

  function setAbsolutePosition(el, nodeBounds, parentBounds) {
    const left = nodeBounds.x - parentBounds.x;
    const top = nodeBounds.y - parentBounds.y;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.width = `${nodeBounds.width}px`;
    el.style.height = `${nodeBounds.height}px`;
  }

  function createElementForNode(node) {
    switch (node.type) {
      case 'TEXT': return document.createElement('div');
      default: return document.createElement('div');
    }
  }

  function renderNode(node, parentEl, parentBounds, assets) {
    const nodeBounds = getBounds(node);
    const el = createElementForNode(node);
    el.classList.add('figma-layer');
    el.setAttribute('data-figma-type', node.type || 'NODE');
    if (node.name) el.setAttribute('aria-label', node.name);

    setAbsolutePosition(el, nodeBounds, parentBounds);
    applyCommon(el, node);
    applyCornerRadii(el, node);
    applyFills(el, node, assets.imageMap);
    applyStrokes(el, node);
    applyRotation(el, node);

    if (node.type === 'TEXT') {
      el.classList.add('text-layer');
      el.textContent = node.characters != null ? node.characters : '';
      applyTextStyles(el, node);
    }

    // Recurse children
    const children = node.children || [];
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      renderNode(child, el, nodeBounds, assets);
    }

    parentEl.appendChild(el);
    return el;
  }

  function setViewportSize(container, root) {
    const b = getBounds(root);
    if (b.width && b.height) {
      container.style.width = `${b.width}px`;
      container.style.height = `${b.height}px`;
    }
  }

  function clearNode(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function renderFigmaTo(container, rootNode, options) {
    const assets = Object.assign({ imageMap: {} }, options || {});
    if (!container || !rootNode) return;
    container.style.position = 'relative';
    clearNode(container);
    setViewportSize(container, rootNode);

    const rootBounds = getBounds(rootNode);
    // Root becomes background if it has fills
    applyFills(container, rootNode, assets.imageMap);
    applyCornerRadii(container, rootNode);
    applyStrokes(container, rootNode);
    applyCommon(container, rootNode);

    const children = rootNode.children || [];
    for (let i = 0; i < children.length; i += 1) {
      renderNode(children[i], container, rootBounds, assets);
    }
  }

  window.renderFigmaTo = renderFigmaTo;
})();

