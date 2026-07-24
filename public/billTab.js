// Bill Tab Logic for White Angel Events Quotation System
window.BillTab = {
  currentQuotationId: null,
  checkpointShowcases: {}, // Maps itemId or fn_id -> { title, description, unitPrice, photos: [], pages: [] }
  activeModalItemId: null,
  letterheadSettings: {
    phoneText: '8149634555 / 9028776555',
    addressText: '17 East, Ayodhya Nagar, Majrewadi, Solapur 413003',
    taglineText: 'Solapur | Pune | Osmanabad | Umarga | Bijapur',
    headerTitle: 'EVENT REQUIREMENT QUOTATION'
  },

  init() {
    this.renderForm();
    this.bindEvents();
    this.recalculateTotals();
  },

  renderForm() {
    const rates = window.StorageManager.getRates();

    // 1. Decoration Checkpoints
    const decContainer = document.getElementById('decorationCheckpoints');
    if (decContainer) {
      decContainer.innerHTML = rates.decoration.map(item => this.createCheckpointRowHtml({
        id: item.id,
        category: 'decoration',
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: 1,
        selected: false
      })).join('');
    }

    // 2. Catering Checkpoints
    const catContainer = document.getElementById('cateringCheckpoints');
    if (catContainer) {
      catContainer.innerHTML = `
        ${this.createCheckpointRowHtml({ id: 'cat_veg', category: 'catering', name: 'Veg Guests (Plates)', unitPrice: rates.catering.vegPerPlate, quantity: 1, selected: false })}
        ${this.createCheckpointRowHtml({ id: 'cat_nonveg', category: 'catering', name: 'Non-Veg Guests (Plates)', unitPrice: rates.catering.nonVegPerPlate, quantity: 1, selected: false })}
        ${this.createCheckpointRowHtml({ id: 'cat_sweets', category: 'catering', name: 'Sweet Items (Plates)', unitPrice: rates.catering.sweetPerPlate, quantity: 1, selected: false })}
        ${this.createCheckpointRowHtml({ id: 'cat_live_1', category: 'catering', name: 'Live Counter 1', unitPrice: rates.catering.liveCounterPerUnit, quantity: 1, selected: false })}
        ${this.createCheckpointRowHtml({ id: 'cat_live_2', category: 'catering', name: 'Live Counter 2', unitPrice: rates.catering.liveCounterPerUnit, quantity: 1, selected: false })}
        ${this.createCheckpointRowHtml({ id: 'cat_live_3', category: 'catering', name: 'Live Counter 3', unitPrice: rates.catering.liveCounterPerUnit, quantity: 1, selected: false })}
      `;
    }

    // 3. Photography Checkpoints
    const photoContainer = document.getElementById('photographyCheckpoints');
    if (photoContainer) {
      photoContainer.innerHTML = rates.photography.map(item => this.createCheckpointRowHtml({
        id: item.id,
        category: 'photography',
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: 1,
        selected: false
      })).join('');
    }

    // 4. Accommodation Checkpoints
    const accContainer = document.getElementById('accommodationCheckpoints');
    if (accContainer) {
      accContainer.innerHTML = `
        ${this.createCheckpointRowHtml({ id: 'acc_rooms', category: 'accommodation', name: 'Hotel Rooms Required', unitPrice: rates.accommodation.perRoomPrice, quantity: 1, selected: false })}
      `;
    }

    // 5. Transport Checkpoints
    const transContainer = document.getElementById('transportCheckpoints');
    if (transContainer) {
      transContainer.innerHTML = rates.transport.map(item => this.createCheckpointRowHtml({
        id: item.id,
        category: 'transport',
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: 1,
        selected: false
      })).join('');
    }
  },

  createCheckpointRowHtml(item) {
    const hasShowcaseData = !!(this.checkpointShowcases[item.id] && (this.checkpointShowcases[item.id].description || (this.checkpointShowcases[item.id].photos && this.checkpointShowcases[item.id].photos.length > 0)));

    return `
      <div class="compact-checkpoint-item ${item.selected ? 'selected' : ''}" data-id="${item.id}" data-category="${item.category}">
        <input type="checkbox" class="item-checkbox" ${item.selected ? 'checked' : ''} onchange="window.BillTab.handleItemToggle(this)">
        <input type="text" class="chk-title-input" value="${item.name}" placeholder="Item Name" onchange="window.BillTab.recalculateTotals()">
        
        <!-- Quantity Set Controls (- / Input / +) -->
        <div style="display: flex; align-items: center; gap: 2px; background: rgba(0,0,0,0.06); border-radius: 4px; padding: 1px 4px; border: 1px solid var(--border-color);">
          <button type="button" style="background: none; border: none; font-weight: 800; cursor: pointer; font-size: 0.85rem; color: var(--accent-blue); padding: 0 4px;" onclick="window.BillTab.adjustItemQty(this, -1)">-</button>
          <input type="number" class="chk-qty-input" value="${item.quantity || 1}" min="1" style="width: 38px; text-align: center; border: none; background: transparent; font-size: 0.78rem; font-weight: 700; color: var(--text-main); outline: none;" onchange="window.BillTab.recalculateTotals()" onkeyup="window.BillTab.recalculateTotals()">
          <button type="button" style="background: none; border: none; font-weight: 800; cursor: pointer; font-size: 0.85rem; color: var(--accent-blue); padding: 0 4px;" onclick="window.BillTab.adjustItemQty(this, 1)">+</button>
        </div>

        <input type="number" class="chk-price-input" value="${item.unitPrice || 0}" min="0" onchange="window.BillTab.recalculateTotals()" onkeyup="window.BillTab.recalculateTotals()">
        <button type="button" class="chk-detail-btn ${hasShowcaseData ? 'has-data' : ''}" onclick="window.BillTab.openVisualPageForCheckpoint('${item.id}')" title="Open Visual Showcase Page">+</button>
      </div>
    `;
  },

  adjustItemQty(btn, delta) {
    const row = btn.closest('.compact-checkpoint-item');
    if (!row) return;
    const qtyInput = row.querySelector('.chk-qty-input');
    if (qtyInput) {
      let current = parseInt(qtyInput.value) || 1;
      current = Math.max(1, current + delta);
      qtyInput.value = current;
      const checkbox = row.querySelector('.item-checkbox');
      if (checkbox) checkbox.checked = true;
      this.recalculateTotals();
    }
  },

  handleItemToggle(checkbox) {
    const itemRow = checkbox.closest('.compact-checkpoint-item');
    if (checkbox.checked) {
      itemRow.classList.add('selected');
    } else {
      itemRow.classList.remove('selected');
    }
    this.recalculateTotals();
  },

  addCustomItem(containerId, categoryName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const id = 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const html = this.createCheckpointRowHtml({
      id,
      category: categoryName,
      name: 'Custom Service Item',
      unitPrice: 1000,
      quantity: 1,
      selected: true
    });

    container.insertAdjacentHTML('beforeend', html);
    this.recalculateTotals();
  },

  recalculateTotals() {
    let subtotal = 0;

    document.querySelectorAll('.compact-checkpoint-item').forEach(row => {
      const checkbox = row.querySelector('.item-checkbox');
      if (checkbox && checkbox.checked) {
        row.classList.add('selected');
        const qty = parseFloat(row.querySelector('.chk-qty-input')?.value) || 1;
        const price = parseFloat(row.querySelector('.chk-price-input')?.value) || 0;
        subtotal += (qty * price);
      } else {
        row.classList.remove('selected');
      }
    });

    // Discount
    const discountPercent = Math.max(0, Math.min(100, parseFloat(document.getElementById('discountPercentInput')?.value) || 0));
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const grandTotal = Math.max(0, subtotal - discountAmount);

    const advancePaid = parseFloat(document.getElementById('advancePaidInput')?.value) || 0;
    const balance = grandTotal - advancePaid;

    if (document.getElementById('displaySubtotal')) {
      document.getElementById('displaySubtotal').textContent = '₹ ' + subtotal.toLocaleString('en-IN');
    }
    if (document.getElementById('displayGrandTotal')) {
      document.getElementById('displayGrandTotal').textContent = '₹ ' + grandTotal.toLocaleString('en-IN') + (discountPercent > 0 ? ` (${discountPercent}% OFF)` : '');
    }
    if (document.getElementById('displayBalance')) {
      document.getElementById('displayBalance').textContent = '₹ ' + balance.toLocaleString('en-IN');
    }
  },

  toggleCardCollapse(cardBodyId, titleBarEl) {
    const body = document.getElementById(cardBodyId);
    if (!body) return;
    const isHidden = window.getComputedStyle(body).display === 'none';
    body.style.display = isHidden ? 'block' : 'none';
    if (titleBarEl) {
      const chevron = titleBarEl.querySelector('.chevron-svg');
      if (chevron) {
        chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
      }
      const icon = titleBarEl.querySelector('.collapse-icon');
      if (icon) icon.textContent = isHidden ? '▲' : '▼';
    }
  },

  toggleOptionalCard(cardId, pillBtn) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const isHidden = window.getComputedStyle(card).display === 'none';
    card.style.display = isHidden ? 'block' : 'none';
    if (pillBtn) {
      if (isHidden) {
        pillBtn.classList.add('active');
      } else {
        pillBtn.classList.remove('active');
      }
    }
  },

  // ==========================================================================
  // FREEFORM SHOWCASE PAGE CREATOR ON "+" BUTTON CLICK
  // ==========================================================================
  openVisualPageForCheckpoint(itemId) {
    this.activeModalItemId = itemId;
    const row = document.querySelector(`.compact-checkpoint-item[data-id="${itemId}"]`);
    if (row) {
      const checkbox = row.querySelector('.item-checkbox');
      if (checkbox) checkbox.checked = true;
      row.classList.add('selected');
    } else if (itemId.startsWith('fn_')) {
      const fnName = itemId.replace('fn_', '');
      const fnCb = Array.from(document.querySelectorAll('.function-checkbox')).find(c => c.value.toLowerCase().includes(fnName.toLowerCase()));
      if (fnCb) fnCb.checked = true;
    }
    this.recalculateTotals();

    const itemName = row ? row.querySelector('.chk-title-input').value : itemId.replace('fn_', '') + ' Setup';
    const itemPrice = row ? row.querySelector('.chk-price-input').value : 0;
    const existing = this.checkpointShowcases[itemId] || {};

    const viewport = document.getElementById('pdfEditorViewport');
    if (!viewport) return;

    if (existing.savedCanvasHtml) {
      viewport.innerHTML = existing.savedCanvasHtml;
    } else {
      // Render initial showcase page
      viewport.innerHTML = `
        <div class="wysiwyg-a4-page" id="showcase-page-1" data-showcase-id="${itemId}" style="padding: 40px 45px; font-family: Inter, sans-serif; background: #ffffff; position: relative;">
          
          <!-- Editable Header Title Bar -->
          <div class="draggable-pdf-element" style="top: 45px; left: 45px; width: 704px; height: 42px; background: #0056b3; color: white; padding: 10px; border-radius: 4px; text-align: center; font-size: 15px; font-weight: 800;" contenteditable="true">
            <span class="drag-handle-badge">✥ Drag Header</span>
            <span class="corner-resize-handle">⤢</span>
            <span id="scHeaderTitle">${(existing.title || itemName + ' SHOWCASE & SETUP DETAILS').toUpperCase()}</span>
          </div>

          <!-- Initial Helper Instructions Dropzone -->
          <div class="draggable-pdf-element helper-dropzone" style="top: 120px; left: 45px; width: 704px; height: 180px; background: #f8fafe; border: 2px dashed #0088ff; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px;">
            <span class="drag-handle-badge">✥ Drag Notice</span>
            <span class="corner-resize-handle">⤢</span>
            <div style="font-size: 14px; font-weight: 800; color: #0056b3; margin-bottom: 6px;">Add Content Cards Anywhere On This Page</div>
            <div style="font-size: 12px; color: #475569;">Click <strong>📝 Add Description</strong>, <strong>🏷️ Add Total Entry</strong>, or <strong>📷 Upload Image</strong> on top toolbar! (Max 4 images per page)</div>
          </div>

        </div>
      `;
    }

    this.makePdfElementsDraggable();

    // Configure Toolbar for Single Showcase Page Creator Mode
    if (document.getElementById('editorToolbarTitle')) {
      document.getElementById('editorToolbarTitle').textContent = `➕ SHOWCASE PAGE: ${itemName.toUpperCase()}`;
    }
    if (document.getElementById('btnSaveSinglePage')) document.getElementById('btnSaveSinglePage').style.display = 'inline-flex';
    if (document.getElementById('btnAddDescription')) document.getElementById('btnAddDescription').style.display = 'inline-flex';
    if (document.getElementById('btnAddTotalEntry')) document.getElementById('btnAddTotalEntry').style.display = 'inline-flex';
    if (document.getElementById('btnUploadImage')) document.getElementById('btnUploadImage').style.display = 'inline-flex';
    if (document.getElementById('btnAddBlankPage')) document.getElementById('btnAddBlankPage').style.display = 'inline-flex';
    
    if (document.getElementById('btnExportPdf')) document.getElementById('btnExportPdf').style.display = 'none';
    if (document.getElementById('btnShareWhatsApp')) document.getElementById('btnShareWhatsApp').style.display = 'none';

    document.getElementById('pdfVisualEditorOverlay').classList.add('active');
    setTimeout(() => this.adjustMobileCanvasScale(), 20);
  },

  adjustMobileCanvasScale() {
    const viewport = document.getElementById('pdfEditorViewport');
    if (!viewport) return;
    const pages = viewport.querySelectorAll('.wysiwyg-a4-page');
    if (pages.length === 0) return;

    const screenWidth = window.innerWidth;
    if (screenWidth <= 820) {
      const padding = 16;
      const targetWidth = Math.max(280, screenWidth - padding);
      const scale = Math.min(1, targetWidth / 794);
      const marginBottom = -1123 * (1 - scale) + 16;

      pages.forEach(page => {
        page.style.transformOrigin = 'top center';
        page.style.transform = `scale(${scale})`;
        page.style.marginBottom = `${marginBottom}px`;
      });
    } else {
      pages.forEach(page => {
        page.style.transformOrigin = '';
        page.style.transform = '';
        page.style.marginBottom = '';
      });
    }
  },

  addDescriptionCardToCanvas() {
    const pages = document.querySelectorAll('.wysiwyg-a4-page');
    if (pages.length === 0) return;
    const activePage = pages[pages.length - 1];

    const helper = activePage.querySelector('.helper-dropzone');
    if (helper) helper.remove();

    const descHtml = `
      <div class="draggable-pdf-element sc-desc-card" style="top: 120px; left: 45px; width: 340px; height: 280px; background: #f8fafe; border: 1.5px solid #d2e1f5; border-radius: 6px; padding: 16px;">
        <span class="drag-handle-badge">✥ Drag Description</span>
        <span class="corner-resize-handle">⤢</span>
        <div style="font-size: 13px; font-weight: 800; color: #0056b3; margin-bottom: 8px;">SETUP SPECIFICATIONS:</div>
        <div class="sc-desc-content" style="font-size: 12px; color: #282828; line-height: 1.6; outline: none;" contenteditable="true">Type custom setup instructions, dimensions, color themes, flower requirements, lighting setups, or special details here...</div>
      </div>
    `;

    activePage.insertAdjacentHTML('beforeend', descHtml);
    this.makePdfElementsDraggable();
    window.App.showToast('Added Draggable Description Card!', 'success');
  },

  addTotalEntryCardToCanvas() {
    const pages = document.querySelectorAll('.wysiwyg-a4-page');
    if (pages.length === 0) return;
    const activePage = pages[pages.length - 1];

    const helper = activePage.querySelector('.helper-dropzone');
    if (helper) helper.remove();

    const row = document.querySelector(`.compact-checkpoint-item[data-id="${this.activeModalItemId}"]`);
    const price = row ? row.querySelector('.chk-price-input').value : 0;

    const priceHtml = `
      <div class="draggable-pdf-element sc-price-card" style="top: 420px; left: 45px; width: 280px; height: 75px; background: #ffffff; border: 1.5px solid #0056b3; border-radius: 6px; padding: 10px;">
        <span class="drag-handle-badge">✥ Drag Total Entry</span>
        <span class="corner-resize-handle">⤢</span>
        <div style="font-size: 10px; font-weight: 700; color: #3c3c3c;">ITEM TOTAL ENTRY:</div>
        <div class="sc-price-val" style="font-size: 16px; font-weight: 800; color: #0088ff;" contenteditable="true">Rs. ${Number(price).toLocaleString('en-IN')}</div>
      </div>
    `;

    activePage.insertAdjacentHTML('beforeend', priceHtml);
    this.makePdfElementsDraggable();
    window.App.showToast('Added Draggable Total Entry Price Card!', 'success');
  },

  async handleCanvasDirectImageUpload(files) {
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) return;

    window.App.showToast(`Processing ${fileList.length} image(s)...`, 'info');

    for (let i = 0; i < fileList.length; i++) {
      let pages = document.querySelectorAll('.wysiwyg-a4-page');
      if (pages.length === 0) {
        this.addBlankCanvasPage();
        pages = document.querySelectorAll('.wysiwyg-a4-page');
      }
      let activePage = pages[pages.length - 1];

      // Remove helper dropzone if present
      const helper = activePage.querySelector('.helper-dropzone');
      if (helper) helper.remove();

      // Check max 4 photos per page rule!
      const currentPhotoCount = activePage.querySelectorAll('.sc-photo-card').length;
      if (currentPhotoCount >= 4) {
        window.App.showToast('Page full (4 images max). Creating new page...', 'info');
        this.addBlankCanvasPage();
        pages = document.querySelectorAll('.wysiwyg-a4-page');
        activePage = pages[pages.length - 1];
        const h = activePage.querySelector('.helper-dropzone');
        if (h) h.remove();
      }

      const file = fileList[i];
      const dataUrl = await this.compressImage(file);
      if (dataUrl) {
        const photoIdx = activePage.querySelectorAll('.sc-photo-card').length;
        const topY = 120 + (photoIdx * 225);
        const imgHtml = `
          <div class="draggable-pdf-element sc-photo-card" style="top: ${topY}px; left: 405px; width: 344px; height: 215px; background: white; border: 1.5px solid #0056b3; border-radius: 6px; overflow: hidden; padding: 3px;">
            <span class="drag-handle-badge">✥ Drag Image</span>
            <span class="corner-resize-handle">⤢</span>
            <button type="button" class="photo-delete-btn" onclick="this.parentElement.remove()" title="Delete Wrong Image">&times;</button>
            <img src="${dataUrl}" alt="Showcase Photo" style="width:100%; height:100%; object-fit:cover; display:block; pointer-events:none; -webkit-user-drag:none;" draggable="false">
          </div>
        `;
        activePage.insertAdjacentHTML('beforeend', imgHtml);
      }
    }

    this.makePdfElementsDraggable();
    const fileInput = document.getElementById('canvasDirectFileInput');
    if (fileInput) fileInput.value = '';

    window.App.showToast('Uploaded image added to page!', 'success');
  },

  saveSingleShowcasePage() {
    const itemId = this.activeModalItemId;
    if (!itemId) return;

    const viewport = document.getElementById('pdfEditorViewport');
    if (!viewport) return;

    const pages = viewport.querySelectorAll('.wysiwyg-a4-page');
    if (pages.length === 0) return;

    let fullDescription = '';
    let itemPrice = 0;
    const photos = [];
    const pagesData = [];

    // Extract contents & photos across all showcase pages for this item
    pages.forEach((page, pIdx) => {
      let pageDesc = '';
      const pagePhotos = [];

      // Descriptions
      page.querySelectorAll('.sc-desc-content').forEach(d => {
        const text = d.innerText.trim();
        pageDesc += text + '\n';
        fullDescription += text + '\n';
      });

      // Price
      const pVal = page.querySelector('.sc-price-val');
      if (pVal) {
        const num = parseFloat(pVal.innerText.replace(/\D/g, '')) || 0;
        if (num > 0) itemPrice = num;
      }

      // Photos
      page.querySelectorAll('.sc-photo-card img, img').forEach(img => {
        if (img.src && img.src.startsWith('data:image/')) {
          const photoObj = { id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), src: img.src };
          photos.push(photoObj);
          pagePhotos.push(photoObj);
        }
      });

      const titleEl = page.querySelector('.draggable-pdf-element span, .draggable-pdf-element');
      const title = titleEl ? titleEl.innerText.replace('✥ Drag Header', '').replace('⤢', '').trim() : `SHOWCASE PAGE #${pIdx + 1}`;

      pagesData.push({
        pageNum: pIdx + 1,
        title,
        description: pageDesc.trim(),
        photos: pagePhotos
      });
    });

    const titleEl = document.getElementById('scHeaderTitle') || pages[0].querySelector('.draggable-pdf-element');
    const title = titleEl ? titleEl.innerText.replace('✥ Drag Header', '').replace('⤢', '').trim() : 'SHOWCASE DETAILS';

    // Create clean HTML copy without delete buttons or edit badges for storage
    const cleanViewport = viewport.cloneNode(true);
    cleanViewport.querySelectorAll('.drag-handle-badge, .corner-resize-handle, .page-delete-btn, .photo-delete-btn, .rate-delete-btn, .helper-dropzone, button').forEach(el => el.remove());

    // Store in checkpointShowcases with full multi-page support
    this.checkpointShowcases[itemId] = {
      title,
      description: fullDescription.trim(),
      unitPrice: itemPrice,
      photos,
      pages: pagesData,
      savedCanvasHtml: cleanViewport.innerHTML
    };

    const row = document.querySelector(`.compact-checkpoint-item[data-id="${itemId}"]`);
    if (row) {
      const priceInput = row.querySelector('.chk-price-input');
      if (itemPrice > 0 && priceInput) priceInput.value = itemPrice;
      const checkbox = row.querySelector('.item-checkbox');
      if (checkbox) checkbox.checked = true;
      row.classList.add('selected');
    }

    const btn = document.getElementById(`btn_${itemId}`) || (row ? row.querySelector('.chk-detail-btn') : null);
    if (btn) {
      if (fullDescription || photos.length > 0 || pagesData.length > 0) {
        btn.classList.add('has-data');
      }
    }

    this.recalculateTotals();
    this.closeInteractivePdfEditor();
    window.App.showToast(`Saved ${pagesData.length} showcase page(s)! Included after Total Box page.`, 'success');
  },

  addBlankCanvasPage() {
    const viewport = document.getElementById('pdfEditorViewport');
    if (!viewport) return;

    const pageCount = viewport.querySelectorAll('.wysiwyg-a4-page').length + 1;
    const pageId = `wysiwyg-page-${pageCount}`;

    const pageHtml = `
      <div class="wysiwyg-a4-page" id="${pageId}" style="padding: 40px 45px; font-family: Inter, sans-serif; background: #ffffff; position: relative;">
        <button type="button" class="page-delete-btn" onclick="this.parentElement.remove()" title="Delete Page">&times;</button>

        <!-- Editable Title Header -->
        <div class="draggable-pdf-element" style="top: 45px; left: 45px; width: 704px; height: 42px; background: #0056b3; color: white; padding: 10px; border-radius: 4px; text-align: center; font-size: 15px; font-weight: 800;" contenteditable="true">
          <span class="drag-handle-badge">✥ Drag Header</span>
          <span class="corner-resize-handle">⤢</span>
          SHOWCASE PAGE #${pageCount}
        </div>

        <div class="draggable-pdf-element helper-dropzone" style="top: 120px; left: 45px; width: 704px; height: 180px; background: #f8fafe; border: 2px dashed #0088ff; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px;">
          <span class="drag-handle-badge">✥ Drag Notice</span>
          <span class="corner-resize-handle">⤢</span>
          <div style="font-size: 14px; font-weight: 800; color: #0056b3; margin-bottom: 6px;">Add Content Cards To Page #${pageCount}</div>
          <div style="font-size: 12px; color: #475569;">Click <strong>📝 Add Description</strong>, <strong>🏷️ Add Total Entry</strong>, or <strong>📷 Upload Image</strong> on top toolbar! (Max 4 images per page)</div>
        </div>

      </div>
    `;

    viewport.insertAdjacentHTML('beforeend', pageHtml);
    this.makePdfElementsDraggable();
    setTimeout(() => this.adjustMobileCanvasScale(), 20);
    window.App.showToast(`Added Showcase Page #${pageCount}!`, 'success');
  },

  compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  },

  // ==========================================
  // EDITABLE LETTERHEAD MODAL & EXTRA COMPANY INFO
  // ==========================================
  addExtraCompanyInfoRow(val = '') {
    const container = document.getElementById('extraCompanyInfoContainer');
    if (!container) return;
    const rowId = 'lh_extra_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const html = `
      <div class="lh-extra-row" id="${rowId}" style="display: flex; align-items: center; gap: 6px;">
        <input type="text" class="form-input lh-extra-input" value="${val}" placeholder="e.g. GST No: 27AAAAA0000A1Z5 or Email / Bank info..." style="flex: 1;">
        <button type="button" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid #ef4444; border-radius: 4px; padding: 4px 8px; font-weight: 800; cursor: pointer;" onclick="document.getElementById('${rowId}').remove()" title="Delete Info Line">&times;</button>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
  },

  openLetterheadModal() {
    document.getElementById('lhPhoneText').value = this.letterheadSettings.phoneText || '';
    document.getElementById('lhAddressText').value = this.letterheadSettings.addressText || '';
    document.getElementById('lhTaglineText').value = this.letterheadSettings.taglineText || '';
    document.getElementById('lhHeaderTitle').value = this.letterheadSettings.headerTitle || '';

    const container = document.getElementById('extraCompanyInfoContainer');
    if (container) {
      container.innerHTML = '';
      const lines = this.letterheadSettings.extraInfoLines || [];
      if (lines.length > 0) {
        lines.forEach(l => this.addExtraCompanyInfoRow(l));
      }
    }

    document.getElementById('letterheadModal').classList.add('active');
  },

  closeLetterheadModal() {
    document.getElementById('letterheadModal').classList.remove('active');
  },

  saveLetterheadSettings() {
    const extraInfoLines = [];
    document.querySelectorAll('.lh-extra-input').forEach(inp => {
      const txt = inp.value.trim();
      if (txt) extraInfoLines.push(txt);
    });

    this.letterheadSettings = {
      phoneText: document.getElementById('lhPhoneText').value.trim(),
      addressText: document.getElementById('lhAddressText').value.trim(),
      taglineText: document.getElementById('lhTaglineText').value.trim(),
      headerTitle: document.getElementById('lhHeaderTitle').value.trim(),
      extraInfoLines
    };

    this.closeLetterheadModal();
    window.App.showToast('Letterhead & extra company info updated!', 'success');
  },

  // ==========================================================================
  // FULL DOCUMENT WYSIWYG PIXEL-PERFECT INTERACTIVE LIVE PDF CANVAS EDITOR
  // ==========================================================================
  openInteractivePdfEditor() {
    const data = this.getQuotationData();
    if (!data) return;

    window.App.showToast('Building pixel-perfect PDF canvas editor...', 'info');

    // Show export buttons & blank page button for full document mode
    if (document.getElementById('editorToolbarTitle')) {
      document.getElementById('editorToolbarTitle').textContent = '🎨 INTERACTIVE PDF CANVAS EDITOR';
    }
    if (document.getElementById('btnSaveSinglePage')) document.getElementById('btnSaveSinglePage').style.display = 'none';
    if (document.getElementById('btnAddDescription')) document.getElementById('btnAddDescription').style.display = 'inline-flex';
    if (document.getElementById('btnAddTotalEntry')) document.getElementById('btnAddTotalEntry').style.display = 'inline-flex';
    if (document.getElementById('btnUploadImage')) document.getElementById('btnUploadImage').style.display = 'inline-flex';
    if (document.getElementById('btnExportPdf')) document.getElementById('btnExportPdf').style.display = 'inline-flex';
    if (document.getElementById('btnShareWhatsApp')) document.getElementById('btnShareWhatsApp').style.display = 'inline-flex';
    if (document.getElementById('btnAddBlankPage')) document.getElementById('btnAddBlankPage').style.display = 'inline-flex';

    this.renderInteractivePdfCanvas(data);
    document.getElementById('pdfVisualEditorOverlay').classList.add('active');
    setTimeout(() => this.adjustMobileCanvasScale(), 20);
  },

  closeInteractivePdfEditor() {
    document.getElementById('pdfVisualEditorOverlay').classList.remove('active');
    this.activeModalItemId = null;
  },

  renderInteractivePdfCanvas(customData) {
    const data = customData || this.getQuotationData();
    const viewport = document.getElementById('pdfEditorViewport');
    if (!viewport) return;

    const assets = window.IMAGE_ASSETS || {};

    const groom = data.clientDetails.groomName || '';
    const bride = data.clientDetails.brideName || '';
    const clientTitle = [groom, bride].filter(Boolean).join(' & ') || 'VALUED CLIENT';
    const functionsStr = (data.selectedFunctions && data.selectedFunctions.length > 0) ? data.selectedFunctions.join(', ') : 'Wedding Event';

    const selectedItems = (data.items || []).filter(i => i.selected);

    const mmToPx = 3.78095;
    let html = '';

    // ----------------------------------------------------
    // PAGE 1: COVER PAGE
    // ----------------------------------------------------
    html += `
      <div class="wysiwyg-a4-page" id="wysiwyg-page-1" style="background: url('${assets.coverPage || 'assets/cover_page.jpg'}') no-repeat center center / 100% 100%;">
        
        <div class="draggable-pdf-element" style="bottom: 90px; left: 50px; width: 694px; height: 75px; background: rgba(11,15,25,0.92); border: 2px solid #00d2ff; padding: 14px; border-radius: 8px; text-align: center; color: white;">
          <span class="drag-handle-badge">✥ Drag</span>
          <span class="corner-resize-handle">⤢</span>
          <div style="font-size: 16px; font-weight: 800; color: #ffffff;" contenteditable="true">EVENT QUOTATION FOR: ${clientTitle.toUpperCase()}</div>
          <div style="font-size: 11px; font-weight: 600; color: #00d2ff; margin-top: 4px;" contenteditable="true">Date Issued: ${new Date().toLocaleDateString('en-IN')} | Quote Ref: #${data.id}</div>
        </div>
      </div>
    `;

    // ----------------------------------------------------
    // UNIFIED PAGINATION ALGORITHM
    // ----------------------------------------------------
    let currentPageIndex = 2;

    const discountPercent = Number(data.payment?.discountPercent) || 0;
    const discountAmount = Math.round((data.payment?.subtotal * discountPercent) / 100);
    const grandTotal = Math.max(0, data.payment?.subtotal - discountAmount);
    const advancePaid = Number(data.payment?.advancePaid) || 0;
    const balanceAmount = grandTotal - advancePaid;

    const hasDiscount = discountPercent > 0;
    const summaryBoxH_mm = hasDiscount ? 36 : 28;
    const noteBoxH_mm = 11;

    let currentY_mm = 48;
    let pageMaxY_mm = 250;

    let currentTableRowsHtml = '';

    const startBillingPageHtml = (pageNum, isPage2) => `
      <div class="wysiwyg-a4-page" id="wysiwyg-page-${pageNum}" style="font-family: Inter, sans-serif; background: ${isPage2 ? `url('${assets.letterhead || 'assets/letterhead_template.jpg'}') no-repeat center center / 100% 100%` : '#ffffff'};">
        
        ${isPage2 ? `
        <div class="draggable-pdf-element" style="top: 40px; right: 45px; width: 340px; height: 50px; text-align: right; font-size: 11px; color: #334155;">
          <span class="drag-handle-badge">✥ Drag</span>
          <span class="corner-resize-handle">⤢</span>
          <div style="font-weight: 700; color: #0284c7; font-size: 12px;" contenteditable="true">Contact: ${data.letterhead?.phoneText || '8149634555 / 9028776555'}</div>
          <div contenteditable="true">${data.letterhead?.addressText || '17 East, Ayodhya Nagar, Majrewadi, Solapur 413003'}</div>
        </div>

        <div class="draggable-pdf-element" style="top: ${Math.round(48 * mmToPx)}px; left: 45px; width: 704px; height: ${Math.round(42 * mmToPx)}px; background: #f8fafe; border: 1.5px solid #0056b3; border-radius: 6px; padding: 14px;">
          <span class="drag-handle-badge">✥ Drag Client Box</span>
          <span class="corner-resize-handle">⤢</span>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 12px; color: #0f172a; font-weight: 600;">
            <div contenteditable="true"><strong>Groom's Name:</strong> ${data.clientDetails.groomName || '-'}</div>
            <div contenteditable="true"><strong>Event Date:</strong> ${data.eventDetails.weddingDate || '-'}</div>
            <div contenteditable="true"><strong>Bride's Name:</strong> ${data.clientDetails.brideName || '-'}</div>
            <div contenteditable="true"><strong>Venue Name:</strong> ${data.eventDetails.venueName || '-'}</div>
            <div contenteditable="true"><strong>Mobile No:</strong> ${data.clientDetails.mobileNumber || '-'}</div>
            <div contenteditable="true"><strong>Guest Count:</strong> ${data.eventDetails.guestCount || '-'}</div>
            <div contenteditable="true"><strong>Address:</strong> ${data.clientDetails.address || '-'}</div>
            <div contenteditable="true"><strong>Event Time:</strong> ${data.eventDetails.eventTime || '-'}</div>
          </div>
          <div style="margin-top: 10px; background: #ffffff; border: 1.5px solid #d2e1f5; padding: 6px; border-radius: 4px; font-size: 12px; font-weight: 800; color: #0056b3; text-align: center;" contenteditable="true">
            EVENT / FUNCTION TYPE(S): ${functionsStr.toUpperCase()}
          </div>
        </div>
        ` : ''}
    `;

    let pageContent = startBillingPageHtml(currentPageIndex, true);
    currentY_mm = 96;
    let tableStartY_mm = currentY_mm;

    selectedItems.forEach((item, idx) => {
      const rowH_mm = 7.5;

      if (currentY_mm + rowH_mm > pageMaxY_mm) {
        pageContent += `
          <div class="draggable-pdf-element" style="top: ${Math.round(tableStartY_mm * mmToPx)}px; left: 45px; width: 704px;">
            <span class="drag-handle-badge">✥ Drag Table</span>
            <span class="corner-resize-handle">⤢</span>
            <table style="width: 100%; border-collapse: collapse; background: white; border: 1.5px solid #0056b3; border-radius: 4px; overflow: hidden;">
              <thead>
                <tr style="background: #0056b3; color: white; font-size: 12px; height: 30px;">
                  <th style="padding: 8px 12px; text-align: left;">DESCRIPTION / REQUIREMENT</th>
                  <th style="padding: 8px 12px; text-align: center;">QTY</th>
                  <th style="padding: 8px 12px; text-align: right;">RATE (Rs.)</th>
                  <th style="padding: 8px 12px; text-align: right;">TOTAL (Rs.)</th>
                </tr>
              </thead>
              <tbody>${currentTableRowsHtml}</tbody>
            </table>
          </div>
        </div>`;

        html += pageContent;

        currentPageIndex++;
        pageMaxY_mm = 270;
        currentY_mm = 16;
        tableStartY_mm = 16;
        currentTableRowsHtml = '';

        pageContent = startBillingPageHtml(currentPageIndex, false);
        currentY_mm += 8;
      }

      currentTableRowsHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
          <td style="padding: 8px 12px; font-size: 12px; font-weight: 600; color: #1e293b;" contenteditable="true">${item.name}</td>
          <td style="padding: 8px 12px; font-size: 12px; text-align: center; color: #475569;" contenteditable="true">${item.quantity || 1}</td>
          <td style="padding: 8px 12px; font-size: 12px; text-align: right; color: #475569;" contenteditable="true">Rs. ${(item.unitPrice || 0).toLocaleString('en-IN')}</td>
          <td style="padding: 8px 12px; font-size: 12px; text-align: right; font-weight: 700; color: #0284c7;" contenteditable="true">Rs. ${((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('en-IN')}</td>
        </tr>
      `;

      currentY_mm += rowH_mm;
    });

    if (currentTableRowsHtml) {
      pageContent += `
        <div class="draggable-pdf-element" style="top: ${Math.round(tableStartY_mm * mmToPx)}px; left: 45px; width: 704px;">
          <span class="drag-handle-badge">✥ Drag Table</span>
          <span class="corner-resize-handle">⤢</span>
          <table style="width: 100%; border-collapse: collapse; background: white; border: 1.5px solid #0056b3; border-radius: 4px; overflow: hidden;">
            <thead>
              <tr style="background: #0056b3; color: white; font-size: 12px; height: 30px;">
                <th style="padding: 8px 12px; text-align: left;">DESCRIPTION / REQUIREMENT</th>
                <th style="padding: 8px 12px; text-align: center;">QTY</th>
                <th style="padding: 8px 12px; text-align: right;">RATE (Rs.)</th>
                <th style="padding: 8px 12px; text-align: right;">TOTAL (Rs.)</th>
              </tr>
            </thead>
            <tbody>${currentTableRowsHtml}</tbody>
          </table>
        </div>`;
    }

    if (currentY_mm + summaryBoxH_mm + 4 > pageMaxY_mm) {
      pageContent += `</div>`;
      html += pageContent;

      currentPageIndex++;
      pageMaxY_mm = 270;
      currentY_mm = 16;
      pageContent = startBillingPageHtml(currentPageIndex, false);
    }

    currentY_mm += 4;
    const summaryBoxY_px = Math.round(currentY_mm * mmToPx);

    pageContent += `
      <!-- Financial Summary Total Box -->
      <div class="draggable-pdf-element" style="top: ${summaryBoxY_px}px; right: 45px; width: 390px; height: ${Math.round(summaryBoxH_mm * mmToPx)}px; background: #f0f4fa; border: 1.5px solid #0056b3; border-radius: 6px; padding: 12px 16px; font-size: 12px; color: #0f172a;">
        <span class="drag-handle-badge">✥ Drag Total Box</span>
        <span class="corner-resize-handle">⤢</span>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: 700;"><span>SUBTOTAL:</span><span>Rs. ${data.payment?.subtotal.toLocaleString('en-IN')}</span></div>
        ${discountPercent > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #0066cc; font-weight: 700;"><span>DISCOUNT (${discountPercent}%):</span><span>- Rs. ${discountAmount.toLocaleString('en-IN')}</span></div>` : ''}
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; font-weight: 800; color: #0f172a;"><span>GRAND TOTAL:</span><span>Rs. ${grandTotal.toLocaleString('en-IN')}</span></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #008c00; font-weight: 700;"><span>ADVANCE PAID:</span><span>Rs. ${advancePaid.toLocaleString('en-IN')}</span></div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; color: #c80000;"><span>BALANCE AMOUNT:</span><span>Rs. ${balanceAmount.toLocaleString('en-IN')}</span></div>
      </div>
    `;

    currentY_mm += summaryBoxH_mm + 6;

    if (currentY_mm + noteBoxH_mm > pageMaxY_mm) {
      pageContent += `</div>`;
      html += pageContent;

      currentPageIndex++;
      pageMaxY_mm = 270;
      currentY_mm = 16;
      pageContent = startBillingPageHtml(currentPageIndex, false);
    }

    const noteBoxY_px = Math.round(currentY_mm * mmToPx);

    pageContent += `
      <!-- Important Note Box -->
      <div class="draggable-pdf-element" style="top: ${noteBoxY_px}px; left: 45px; width: 704px; height: ${Math.round(noteBoxH_mm * mmToPx)}px; background: #fef2f2; border: 1.5px solid #f87171; padding: 10px; border-radius: 6px; color: #b91c1c; font-size: 11px; font-weight: 800; text-align: center;" contenteditable="true">
        <span class="drag-handle-badge">✥ Drag Note</span>
        <span class="corner-resize-handle">⤢</span>
        IMPORTANT NOTE: 80% PAYMENT MUST BE PAID 15 DAYS BEFORE OF EVENT.
      </div>
    </div>`;

    html += pageContent;

    // ----------------------------------------------------
    // DEDICATED SHOWCASE PAGES (Page 3+ Saved After Total Box)
    // ----------------------------------------------------
    const allShowcases = [];
    selectedItems.forEach(item => {
      if (item.showcase && (item.showcase.description || (item.showcase.photos && item.showcase.photos.length > 0) || item.showcase.savedCanvasHtml)) {
        allShowcases.push({ id: item.id, name: item.name, showcase: item.showcase, unitPrice: item.unitPrice });
      }
    });

    Object.keys(this.checkpointShowcases).forEach(key => {
      if (key.startsWith('fn_')) {
        const sc = this.checkpointShowcases[key];
        if (sc && (sc.description || (sc.photos && sc.photos.length > 0) || sc.savedCanvasHtml)) {
          allShowcases.push({ id: key, name: sc.title || key.replace('fn_', '') + ' Function', showcase: sc, unitPrice: sc.unitPrice || 0 });
        }
      }
    });

    allShowcases.forEach((item, sIdx) => {
      currentPageIndex++;
      const sc = item.showcase;

      if (sc.savedCanvasHtml) {
        html += sc.savedCanvasHtml;
      } else {
        const pageId = `wysiwyg-page-${currentPageIndex}`;
        const photoCardsHtml = (sc.photos || []).map((p, pIdx) => `
          <div class="draggable-pdf-element sc-photo-card" style="position: absolute; top: ${pIdx * 230}px; left: 0; width: 380px; height: 215px; background: white; border: 1.5px solid #d2e1f5; border-radius: 6px; overflow: hidden; padding: 4px;">
            <span class="drag-handle-badge">✥ Drag Photo ${pIdx + 1}</span>
            <span class="corner-resize-handle">⤢</span>
            <button type="button" class="photo-delete-btn" onclick="this.parentElement.remove()" title="Delete Wrong Image">&times;</button>
            <img src="${p.src}" alt="Showcase Photo" style="width:100%; height:100%; object-fit:cover; display:block; pointer-events:none; -webkit-user-drag:none;" draggable="false">
          </div>
        `).join('');

        html += `
          <div class="wysiwyg-a4-page" id="${pageId}" data-showcase-id="${item.id}" style="padding: 40px 45px; font-family: Inter, sans-serif; background: #ffffff;">
            <button type="button" class="page-delete-btn" onclick="this.parentElement.remove()" title="Delete Page">&times;</button>
            
            <div class="draggable-pdf-element" style="top: 45px; left: 45px; width: 704px; height: 42px; background: #0056b3; color: white; padding: 10px; border-radius: 4px; text-align: center; font-size: 15px; font-weight: 800;" contenteditable="true">
              <span class="drag-handle-badge">✥ Drag Header</span>
              <span class="corner-resize-handle">⤢</span>
              ${(sc.title || item.name).toUpperCase()}
            </div>

            <div class="draggable-pdf-element sc-desc-card" style="top: 105px; left: 45px; width: 300px; height: 930px; background: #f8fafe; border: 1.5px solid #d2e1f5; border-radius: 6px; padding: 16px;">
              <span class="drag-handle-badge">✥ Drag Description</span>
              <span class="corner-resize-handle">⤢</span>
              <div style="font-size: 13px; font-weight: 800; color: #0056b3; margin-bottom: 10px;">SETUP SPECIFICATIONS:</div>
              <div class="sc-desc-content" style="font-size: 12px; color: #282828; line-height: 1.6; margin-bottom: 18px;" contenteditable="true">${sc.description || 'Enter custom setup instructions...'}</div>
              <div style="background: white; border: 1.5px solid #0056b3; padding: 10px; border-radius: 4px;">
                <div style="font-size: 10px; font-weight: 700; color: #3c3c3c;">ITEM TOTAL ENTRY:</div>
                <div class="sc-price-val" style="font-size: 15px; font-weight: 800; color: #0088ff;" contenteditable="true">Rs. ${(sc.unitPrice || item.unitPrice).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div style="position: absolute; top: 105px; left: 365px; width: 384px; height: 930px;">
              ${photoCardsHtml || `<div style="text-align: center; color: #787878; font-size: 13px; padding-top: 100px;">No photo attachments for this setup.</div>`}
            </div>

          </div>
        `;
      }
    });

    viewport.innerHTML = html;
    this.makePdfElementsDraggable();
  },

  makePdfElementsDraggable() {
    const draggables = document.querySelectorAll('.draggable-pdf-element');

    draggables.forEach(el => {
      const resizeHandle = el.querySelector('.corner-resize-handle');

      // Prevent native image dragging interference
      const imgs = el.querySelectorAll('img');
      imgs.forEach(img => {
        img.setAttribute('draggable', 'false');
        img.style.pointerEvents = 'none';
        img.style.userSelect = 'none';
        img.style.webkitUserDrag = 'none';
        img.addEventListener('dragstart', e => e.preventDefault());
      });

      const initDrag = (e) => {
        if (e.target === resizeHandle || (e.target.classList && e.target.classList.contains('corner-resize-handle'))) {
          return;
        }

        if (e.target.isContentEditable && e.target !== el && !e.target.classList.contains('drag-handle-badge')) {
          return;
        }
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX || (e.touches && e.touches[0].clientX);
        const startY = e.clientY || (e.touches && e.touches[0].clientY);

        const initialLeft = el.offsetLeft;
        const initialTop = el.offsetTop;

        el.style.position = 'absolute';
        el.classList.add('selected');

        const onMove = (moveEvt) => {
          const currentX = moveEvt.clientX || (moveEvt.touches && moveEvt.touches[0].clientX);
          const currentY = moveEvt.clientY || (moveEvt.touches && moveEvt.touches[0].clientY);
          if (currentX === undefined || currentY === undefined) return;

          const pageEl = el.closest('.wysiwyg-a4-page');
          const pageRect = pageEl ? pageEl.getBoundingClientRect() : null;
          const scale = (pageRect && pageRect.width > 0) ? (pageRect.width / 794) : 1;

          const deltaX = (currentX - startX) / scale;
          const deltaY = (currentY - startY) / scale;

          el.style.left = Math.max(0, Math.min(794 - el.offsetWidth, initialLeft + deltaX)) + 'px';
          el.style.top = Math.max(0, Math.min(1123 - el.offsetHeight, initialTop + deltaY)) + 'px';
        };

        const onStop = () => {
          el.classList.remove('selected');
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onStop);
          document.removeEventListener('touchmove', onMove);
          document.removeEventListener('touchend', onStop);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onStop);
        document.addEventListener('touchmove', onMove);
        document.addEventListener('touchend', onStop);
      };

      el.addEventListener('mousedown', initDrag);
      el.addEventListener('touchstart', initDrag, { passive: false });

      if (resizeHandle) {
        const initResize = (e) => {
          e.preventDefault();
          e.stopPropagation();

          const startX = e.clientX || (e.touches && e.touches[0].clientX);
          const startY = e.clientY || (e.touches && e.touches[0].clientY);

          const pageEl = el.closest('.wysiwyg-a4-page');
          const pageRect = pageEl ? pageEl.getBoundingClientRect() : null;
          const scale = (pageRect && pageRect.width > 0) ? (pageRect.width / 794) : 1;

          const startWidth = el.offsetWidth;
          const startHeight = el.offsetHeight;

          const onResizeMove = (resizeEvt) => {
            const currentX = resizeEvt.clientX || (resizeEvt.touches && resizeEvt.touches[0].clientX);
            const currentY = resizeEvt.clientY || (resizeEvt.touches && resizeEvt.touches[0].clientY);

            const deltaX = (currentX - startX) / scale;
            const deltaY = (currentY - startY) / scale;

            const newWidth = Math.max(60, startWidth + deltaX);
            const newHeight = Math.max(30, startHeight + deltaY);

            el.style.width = newWidth + 'px';
            el.style.height = newHeight + 'px';
          };

          const onResizeStop = () => {
            document.removeEventListener('mousemove', onResizeMove);
            document.removeEventListener('mouseup', onResizeStop);
            document.removeEventListener('touchmove', onResizeMove);
            document.removeEventListener('touchend', onResizeStop);
          };

          document.addEventListener('mousemove', onResizeMove);
          document.addEventListener('mouseup', onResizeStop);
          document.addEventListener('touchmove', onResizeMove);
          document.addEventListener('touchend', onResizeStop);
        };

        resizeHandle.addEventListener('mousedown', initResize);
        resizeHandle.addEventListener('touchstart', initResize);
      }
    });
  },

  async downloadEditedPdfFromCanvas() {
    const pages = document.querySelectorAll('.wysiwyg-a4-page');
    if (pages.length === 0) return;

    window.App.showToast('Rendering 600 DPI Ultra-HD PDF from visual canvas...', 'info');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i];
      const clone = pageEl.cloneNode(true);
      clone.style.cssText = 'position: fixed; left: -9999px; top: -9999px; width: 794px; height: 1123px; background: #ffffff; z-index: -9999; transform: none !important; margin: 0 !important;';
      
      // Physically REMOVE all delete buttons, badges, handles, and dropzones
      clone.querySelectorAll('.drag-handle-badge, .corner-resize-handle, .page-delete-btn, .photo-delete-btn, .rate-delete-btn, .helper-dropzone, button').forEach(b => b.remove());

      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');
      if (i > 0) doc.addPage();
      doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    }

    const data = this.getQuotationData();
    const clientName = [data.clientDetails.groomName, data.clientDetails.brideName].filter(Boolean).join('_') || 'Client';
    const filename = `White_Angel_Quotation_Edited_${clientName}_No${data.id}.pdf`;

    doc.save(filename);
    this.closeInteractivePdfEditor();
    this.clearFormFields();
    window.App.showToast(`Custom Edited PDF #${data.id} downloaded successfully!`, 'success');
  },

  async shareEditedPdfWhatsAppFromCanvas() {
    const pages = document.querySelectorAll('.wysiwyg-a4-page');
    if (pages.length === 0) return;

    window.App.showToast('Generating edited PDF file for WhatsApp sharing...', 'info');

    document.querySelectorAll('.drag-handle-badge, .corner-resize-handle, .page-delete-btn, .helper-dropzone').forEach(b => b.style.display = 'none');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i];
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      if (i > 0) doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
    }

    document.querySelectorAll('.drag-handle-badge, .corner-resize-handle, .page-delete-btn, .helper-dropzone').forEach(b => b.style.display = '');

    const data = this.getQuotationData();
    const clientName = [data.clientDetails.groomName, data.clientDetails.brideName].filter(Boolean).join('_') || 'Client';
    const filename = `White_Angel_Quotation_Edited_${clientName}_No${data.id}.pdf`;

    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
    const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

    const phone = data.clientDetails.mobileNumber.replace(/\D/g, '');

    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: `White Angel Events Quotation #${data.id}`,
        text: `White Angel Events Quotation for ${clientName}`
      });
      window.App.showToast(`Custom Edited PDF shared on WhatsApp!`, 'success');
    } else {
      doc.save(filename);
      const whatsappUrl = phone ? `https://wa.me/91${phone}` : `https://wa.me/`;
      window.open(whatsappUrl, '_blank');
      window.App.showToast(`PDF downloaded! Please attach in WhatsApp.`, 'info');
    }

    this.closeInteractivePdfEditor();
    this.clearFormFields();
  },

  // Extract Full Quotation Object
  getQuotationData() {
    const selectedFunctions = [];
    document.querySelectorAll('.function-checkbox:checked').forEach(cb => {
      if (cb.value === 'Other') {
        const txt = document.getElementById('otherFunctionText')?.value.trim();
        selectedFunctions.push(txt ? `Other: ${txt}` : 'Other');
      } else {
        selectedFunctions.push(cb.value);
      }
    });

    const items = [];

    document.querySelectorAll('.compact-checkpoint-item').forEach(row => {
      const id = row.getAttribute('data-id');
      if (!id) return;

      const checkbox = row.querySelector('.item-checkbox');
      const selected = checkbox ? checkbox.checked : false;
      const name = row.querySelector('.chk-title-input')?.value || 'Service Item';
      const quantity = parseFloat(row.querySelector('.chk-qty-input')?.value) || 1;
      const unitPrice = parseFloat(row.querySelector('.chk-price-input')?.value) || 0;
      const category = row.getAttribute('data-category') || 'general';

      items.push({
        id,
        category,
        name,
        quantity,
        unitPrice,
        selected,
        showcase: this.checkpointShowcases[id] || null
      });
    });

    let subtotal = 0;
    items.forEach(i => {
      if (i.selected) subtotal += (i.quantity * i.unitPrice);
    });

    const discountPercent = Math.max(0, Math.min(100, parseFloat(document.getElementById('discountPercentInput')?.value) || 0));
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const grandTotal = Math.max(0, subtotal - discountAmount);
    const advancePaid = parseFloat(document.getElementById('advancePaidInput')?.value) || 0;

    return {
      id: this.currentQuotationId || window.StorageManager.getNextQuoteId(),
      clientDetails: {
        groomName: document.getElementById('groomName')?.value || '',
        brideName: document.getElementById('brideName')?.value || '',
        mobileNumber: document.getElementById('mobileNumber')?.value || '',
        alternateNumber: document.getElementById('alternateNumber')?.value || '',
        address: document.getElementById('clientAddress')?.value || '',
        email: document.getElementById('clientEmail')?.value || ''
      },
      eventDetails: {
        weddingDate: document.getElementById('weddingDate')?.value || '',
        venueName: document.getElementById('venueName')?.value || '',
        venueAddress: document.getElementById('venueAddress')?.value || '',
        eventTime: document.getElementById('eventTime')?.value || '',
        guestCount: document.getElementById('guestCount')?.value || ''
      },
      selectedFunctions,
      items,
      functionShowcases: this.checkpointShowcases,
      letterhead: this.letterheadSettings,
      payment: {
        subtotal,
        discountPercent,
        discountAmount,
        estimatedBudget: parseFloat(document.getElementById('estimatedBudgetInput')?.value) || 0,
        advancePaid,
        grandTotal,
        balanceAmount: grandTotal - advancePaid
      },
      specialInstructions: document.getElementById('specialInstructionsInput')?.value || ''
    };
  },

  saveQuotationToSummary() {
    const data = this.getQuotationData();
    const saved = window.StorageManager.saveQuotation(data);
    if (saved && window.SummaryTab) {
      window.SummaryTab.loadQuotations();
    }
    return data;
  },

  clearFormFields() {
    this.currentQuotationId = null;
    this.checkpointShowcases = {};
    this.renderForm();

    ['groomName', 'brideName', 'mobileNumber', 'alternateNumber', 'clientAddress', 'clientEmail', 
     'weddingDate', 'venueName', 'venueAddress', 'eventTime', 'guestCount', 
     'estimatedBudgetInput', 'discountPercentInput', 'advancePaidInput', 'specialInstructionsInput', 'otherFunctionText'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    document.querySelectorAll('.function-checkbox').forEach(cb => cb.checked = false);
    document.querySelectorAll('.chk-detail-btn').forEach(btn => btn.classList.remove('has-data'));
    this.recalculateTotals();
  },

  async generatePdf(e) {
    if (e && e.preventDefault) e.preventDefault();

    const data = this.saveQuotationToSummary();
    if (!data) return;

    window.App.showToast(`Generating PDF...`, 'info');

    try {
      const doc = await window.PdfGenerator.generatePdf(data);
      const clientName = [data.clientDetails.groomName, data.clientDetails.brideName].filter(Boolean).join('_') || 'Client';
      const filename = `White_Angel_Quotation_${clientName}_No${data.id}.pdf`;
      doc.save(filename);
      
      this.clearFormFields();
      window.App.showToast(`Quotation #${data.id} saved to Summary & PDF downloaded!`, 'success');
    } catch (err) {
      console.error('PDF error:', err);
      window.App.showToast('Error generating PDF', 'error');
    }
  },

  async sendWhatsApp(e) {
    if (e && e.preventDefault) e.preventDefault();

    const data = this.saveQuotationToSummary();
    if (!data) return;

    window.App.showToast('Generating PDF file for WhatsApp sharing...', 'info');

    try {
      const doc = await window.PdfGenerator.generatePdf(data);
      const clientName = [data.clientDetails.groomName, data.clientDetails.brideName].filter(Boolean).join('_') || 'Client';
      const filename = `White_Angel_Quotation_${clientName}_No${data.id}.pdf`;

      const pdfArrayBuffer = doc.output('arraybuffer');
      const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      const phone = data.clientDetails.mobileNumber.replace(/\D/g, '');

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `White Angel Events Quotation #${data.id}`,
          text: `White Angel Events Quotation for ${clientName}`
        });
        window.App.showToast(`PDF #${data.id} shared directly to WhatsApp!`, 'success');
      } else {
        doc.save(filename);
        const whatsappUrl = phone ? `https://wa.me/91${phone}` : `https://wa.me/`;
        window.open(whatsappUrl, '_blank');
        window.App.showToast(`PDF #${data.id} downloaded! Please attach it in WhatsApp chat.`, 'info');
      }

      this.clearFormFields();
    } catch (err) {
      console.error('WhatsApp PDF sharing error:', err);
      this.clearFormFields();
    }
  },

  loadQuotationForEdit(quotation) {
    if (!quotation) return;
    this.currentQuotationId = quotation.id;

    if (document.getElementById('groomName')) document.getElementById('groomName').value = quotation.clientDetails.groomName || '';
    if (document.getElementById('brideName')) document.getElementById('brideName').value = quotation.clientDetails.brideName || '';
    if (document.getElementById('mobileNumber')) document.getElementById('mobileNumber').value = quotation.clientDetails.mobileNumber || '';
    if (document.getElementById('alternateNumber')) document.getElementById('alternateNumber').value = quotation.clientDetails.alternateNumber || '';
    if (document.getElementById('clientAddress')) document.getElementById('clientAddress').value = quotation.clientDetails.address || '';
    if (document.getElementById('clientEmail')) document.getElementById('clientEmail').value = quotation.clientDetails.email || '';

    if (document.getElementById('weddingDate')) document.getElementById('weddingDate').value = quotation.eventDetails.weddingDate || '';
    if (document.getElementById('venueName')) document.getElementById('venueName').value = quotation.eventDetails.venueName || '';
    if (document.getElementById('venueAddress')) document.getElementById('venueAddress').value = quotation.eventDetails.venueAddress || '';
    if (document.getElementById('eventTime')) document.getElementById('eventTime').value = quotation.eventDetails.eventTime || '';
    if (document.getElementById('guestCount')) document.getElementById('guestCount').value = quotation.eventDetails.guestCount || '';

    document.querySelectorAll('.function-checkbox').forEach(cb => {
      const match = (quotation.selectedFunctions || []).find(f => f.startsWith(cb.value));
      cb.checked = !!match;
      if (cb.value === 'Other' && match && match.includes(':')) {
        document.getElementById('otherFunctionText').value = match.split(':')[1].trim();
      }
    });

    this.checkpointShowcases = quotation.functionShowcases || quotation.checkpointShowcases || {};

    (quotation.items || []).forEach(item => {
      const row = document.querySelector(`.compact-checkpoint-item[data-id="${item.id}"]`);
      if (row) {
        row.querySelector('.item-checkbox').checked = item.selected;
        row.querySelector('.chk-title-input').value = item.name;
        if (row.querySelector('.chk-qty-input')) row.querySelector('.chk-qty-input').value = item.quantity || 1;
        row.querySelector('.chk-price-input').value = item.unitPrice;
      }
      if (item.showcase) {
        this.checkpointShowcases[item.id] = item.showcase;
      }
    });

    // Update showcase button green highlights
    Object.keys(this.checkpointShowcases).forEach(key => {
      const sc = this.checkpointShowcases[key];
      const btn = document.getElementById(`btn_${key}`) || document.querySelector(`.compact-checkpoint-item[data-id="${key}"] .chk-detail-btn`);
      if (btn && sc && (sc.description || (sc.photos && sc.photos.length > 0) || sc.savedCanvasHtml)) {
        btn.classList.add('has-data');
      }
    });

    if (document.getElementById('estimatedBudgetInput')) document.getElementById('estimatedBudgetInput').value = quotation.payment?.estimatedBudget || 0;
    if (document.getElementById('discountPercentInput')) document.getElementById('discountPercentInput').value = quotation.payment?.discountPercent || 0;
    if (document.getElementById('advancePaidInput')) document.getElementById('advancePaidInput').value = quotation.payment?.advancePaid || 0;
    if (document.getElementById('specialInstructionsInput')) document.getElementById('specialInstructionsInput').value = quotation.specialInstructions || '';

    if (quotation.letterhead) {
      this.letterheadSettings = quotation.letterhead;
    }

    this.recalculateTotals();
    window.App.switchTab('bill');
    window.App.showToast(`Loaded Quotation #${quotation.id} for editing`, 'info');
  },

  bindEvents() {
    const fileInput = document.getElementById('canvasDirectFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleCanvasDirectImageUpload(e.target.files));
    }
    window.addEventListener('resize', () => this.adjustMobileCanvasScale());
  }
};
