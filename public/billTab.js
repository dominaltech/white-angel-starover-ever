// Bill Tab Logic for White Angel Events Quotation System
window.BillTab = {
  currentQuotationId: null,
  checkpointShowcases: {}, // Maps itemId or fn_id -> { title, description, unitPrice, photos: [] }
  activeModalItemId: null,
  modalUploadedPhotos: [],
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
        ${this.createCheckpointRowHtml({ id: 'cat_veg', category: 'catering', name: 'Veg Guests (Plates)', unitPrice: rates.catering.vegPerPlate, quantity: 100, selected: false })}
        ${this.createCheckpointRowHtml({ id: 'cat_nonveg', category: 'catering', name: 'Non-Veg Guests (Plates)', unitPrice: rates.catering.nonVegPerPlate, quantity: 100, selected: false })}
        ${this.createCheckpointRowHtml({ id: 'cat_sweets', category: 'catering', name: 'Sweet Items (Plates)', unitPrice: rates.catering.sweetPerPlate, quantity: 100, selected: false })}
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
        ${this.createCheckpointRowHtml({ id: 'acc_rooms', category: 'accommodation', name: 'Hotel Rooms Required', unitPrice: rates.accommodation.perRoomPrice, quantity: 5, selected: false })}
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
        <button type="button" class="chk-detail-btn ${hasShowcaseData ? 'has-data' : ''}" onclick="window.BillTab.openCheckpointModal('${item.id}')" title="Add Showcase Details & Photos">+</button>
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

  // ==========================================
  // CHECKPOINT (+) MODAL & SHOWCASE EDITOR
  // ==========================================
  openCheckpointModal(itemId) {
    this.activeModalItemId = itemId;
    const row = document.querySelector(`.compact-checkpoint-item[data-id="${itemId}"]`);
    const itemName = row ? row.querySelector('.chk-title-input').value : (itemId.startsWith('fn_') ? itemId.replace('fn_', '') + ' Function' : 'Checkpoint Item');
    const itemPrice = row ? row.querySelector('.chk-price-input').value : 0;

    document.getElementById('modalItemId').value = itemId;
    document.getElementById('modalCheckpointItemName').textContent = `➕ SHOWCASE DETAILS: ${itemName.toUpperCase()}`;

    const existing = this.checkpointShowcases[itemId] || {};
    document.getElementById('modalShowcaseTitle').value = existing.title || `${itemName} Showcase & Setup Details`;
    document.getElementById('modalShowcaseDesc').value = existing.description || '';
    document.getElementById('modalShowcasePrice').value = existing.unitPrice !== undefined ? existing.unitPrice : itemPrice;

    this.modalUploadedPhotos = existing.photos ? [...existing.photos] : [];
    this.renderModalPhotos();

    document.getElementById('checkpointModal').classList.add('active');
  },

  closeCheckpointModal() {
    document.getElementById('checkpointModal').classList.remove('active');
    this.activeModalItemId = null;
    this.modalUploadedPhotos = [];
  },

  compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) {
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

  async handleModalPhotoUpload(files) {
    const fileList = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (fileList.length === 0) return;

    window.App.showToast(`Optimizing ${fileList.length} photo(s)...`, 'info');

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const compressedDataUrl = await this.compressImage(file);
      if (compressedDataUrl) {
        this.modalUploadedPhotos.push({
          id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          src: compressedDataUrl
        });
      }
    }

    const fileInput = document.getElementById('modalFileInput');
    if (fileInput) fileInput.value = '';

    this.renderModalPhotos();
  },

  renderModalPhotos() {
    const grid = document.getElementById('modalPhotoGrid');
    if (!grid) return;

    if (this.modalUploadedPhotos.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 0.78rem;">No photos attached for this checkpoint yet.</div>`;
      return;
    }

    grid.innerHTML = this.modalUploadedPhotos.map((photo, idx) => `
      <div class="modal-photo-card">
        <button type="button" class="modal-photo-remove" onclick="window.BillTab.removeModalPhoto('${photo.id}')">&times;</button>
        <img src="${photo.src}" alt="Checkpoint Photo ${idx + 1}">
      </div>
    `).join('');
  },

  removeModalPhoto(id) {
    this.modalUploadedPhotos = this.modalUploadedPhotos.filter(p => p.id !== id);
    this.renderModalPhotos();
  },

  saveCheckpointModalData() {
    const itemId = this.activeModalItemId;
    if (!itemId) return;

    const title = document.getElementById('modalShowcaseTitle').value.trim();
    const description = document.getElementById('modalShowcaseDesc').value.trim();
    const price = parseFloat(document.getElementById('modalShowcasePrice').value) || 0;

    this.checkpointShowcases[itemId] = {
      title,
      description,
      unitPrice: price,
      photos: [...this.modalUploadedPhotos]
    };

    const row = document.querySelector(`.compact-checkpoint-item[data-id="${itemId}"]`);
    if (row) {
      row.querySelector('.chk-price-input').value = price;
      row.querySelector('.item-checkbox').checked = true;
      row.classList.add('selected');
    }

    const btn = document.getElementById(`btn_${itemId}`) || (row ? row.querySelector('.chk-detail-btn') : null);
    if (btn) {
      if (description || this.modalUploadedPhotos.length > 0) {
        btn.classList.add('has-data');
      } else {
        btn.classList.remove('has-data');
      }
    }

    this.recalculateTotals();
    this.closeCheckpointModal();
    window.App.showToast('Showcase details saved!', 'success');
  },

  // ==========================================
  // EDITABLE LETTERHEAD MODAL
  // ==========================================
  openLetterheadModal() {
    document.getElementById('lhPhoneText').value = this.letterheadSettings.phoneText;
    document.getElementById('lhAddressText').value = this.letterheadSettings.addressText;
    document.getElementById('lhTaglineText').value = this.letterheadSettings.taglineText;
    document.getElementById('lhHeaderTitle').value = this.letterheadSettings.headerTitle;

    document.getElementById('letterheadModal').classList.add('active');
  },

  closeLetterheadModal() {
    document.getElementById('letterheadModal').classList.remove('active');
  },

  saveLetterheadSettings() {
    this.letterheadSettings = {
      phoneText: document.getElementById('lhPhoneText').value.trim(),
      addressText: document.getElementById('lhAddressText').value.trim(),
      taglineText: document.getElementById('lhTaglineText').value.trim(),
      headerTitle: document.getElementById('lhHeaderTitle').value.trim()
    };

    this.closeLetterheadModal();
    window.App.showToast('Letterhead settings updated!', 'success');
  },

  // ==========================================================================
  // FULLSCREEN WYSIWYG PIXEL-PERFECT INTERACTIVE LIVE PDF CANVAS EDITOR
  // ==========================================================================
  openInteractivePdfEditor() {
    const data = this.getQuotationData();
    if (!data) return;

    window.App.showToast('Building pixel-perfect PDF canvas editor...', 'info');
    this.renderInteractivePdfCanvas(data);
    document.getElementById('pdfVisualEditorOverlay').classList.add('active');
  },

  closeInteractivePdfEditor() {
    document.getElementById('pdfVisualEditorOverlay').classList.remove('active');
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

    // MM to PX Scale Ratio for A4 Page (210mm = 794px, 297mm = 1123px => 1mm = 3.78095px)
    const mmToPx = 3.78095;

    let html = '';

    // ----------------------------------------------------
    // PAGE 1: COVER PAGE (Pixel-perfect A4 794px x 1123px with Cover Graphic)
    // ----------------------------------------------------
    html += `
      <div class="wysiwyg-a4-page" id="wysiwyg-page-1" style="background: url('${assets.coverPage || 'assets/cover_page.jpg'}') no-repeat center center / 100% 100%;">
        
        <!-- Editable & Draggable Client Tag Banner -->
        <div class="draggable-pdf-element" style="bottom: 90px; left: 50px; width: 694px; height: 75px; background: rgba(11,15,25,0.92); border: 2px solid #00d2ff; padding: 14px; border-radius: 8px; text-align: center; color: white;">
          <span class="drag-handle-badge">✥ Drag</span>
          <span class="corner-resize-handle">⤢</span>
          <div style="font-size: 16px; font-weight: 800; color: #ffffff;" contenteditable="true">EVENT QUOTATION FOR: ${clientTitle.toUpperCase()}</div>
          <div style="font-size: 11px; font-weight: 600; color: #00d2ff; margin-top: 4px;" contenteditable="true">Date Issued: ${new Date().toLocaleDateString('en-IN')} | Quote Ref: #${data.id}</div>
        </div>
      </div>
    `;

    // ----------------------------------------------------
    // UNIFIED PAGINATION ALGORITHM (100% PARITY WITH pdfGenerator.js)
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

    let currentY_mm = 48; // Starts after header at 48mm for Page 2
    let pageMaxY_mm = 250;

    let currentTableRowsHtml = '';

    // Helper to start a page container
    // Page 2 ONLY gets the letterhead graphic background & printed header overlay (matching pdfGenerator.js)!
    // Page 3+ are rendered as NORMAL plain white pages (#ffffff) with no letterhead template graphic.
    const startBillingPageHtml = (pageNum, isPage2) => `
      <div class="wysiwyg-a4-page" id="wysiwyg-page-${pageNum}" style="font-family: Inter, sans-serif; background: ${isPage2 ? `url('${assets.letterhead || 'assets/letterhead_template.jpg'}') no-repeat center center / 100% 100%` : '#ffffff'};">
        
        ${isPage2 ? `
        <!-- Editable Letterhead Contact Header Overlay (Page 2 Only) -->
        <div class="draggable-pdf-element" style="top: 40px; right: 45px; width: 340px; height: 50px; text-align: right; font-size: 11px; color: #334155;">
          <span class="drag-handle-badge">✥ Drag</span>
          <span class="corner-resize-handle">⤢</span>
          <div style="font-weight: 700; color: #0284c7; font-size: 12px;" contenteditable="true">Contact: ${data.letterhead?.phoneText || '8149634555 / 9028776555'}</div>
          <div contenteditable="true">${data.letterhead?.addressText || '17 East, Ayodhya Nagar, Majrewadi, Solapur 413003'}</div>
        </div>

        <!-- Client & Event Info Box (Page 2 Only, yPos = 48mm) -->
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

    // Start Page 2 (Letterhead Page)
    let pageContent = startBillingPageHtml(currentPageIndex, true);
    currentY_mm = 96; // Table starts at 96mm on Page 2 after Client Box (48 + 48)

    let tableStartY_mm = currentY_mm;

    selectedItems.forEach((item, idx) => {
      const rowH_mm = 7.5;

      // Check if row overflows page
      if (currentY_mm + rowH_mm > pageMaxY_mm) {
        // Close table on current page
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
        </div>`; // Close page container

        html += pageContent;

        // Advance to Page 3+ (Normal Plain White Page)
        currentPageIndex++;
        pageMaxY_mm = 270;
        currentY_mm = 16;
        tableStartY_mm = 16;
        currentTableRowsHtml = '';

        pageContent = startBillingPageHtml(currentPageIndex, false);
        currentY_mm += 8; // Header height
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

    // Render remaining table on current page
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

    // CHECK IF FINANCIAL SUMMARY TOTAL BOX OVERFLOWS CURRENT PAGE
    if (currentY_mm + summaryBoxH_mm + 4 > pageMaxY_mm) {
      pageContent += `</div>`; // Close current page
      html += pageContent;

      currentPageIndex++;
      pageMaxY_mm = 270;
      currentY_mm = 16;
      pageContent = startBillingPageHtml(currentPageIndex, false);
    }

    currentY_mm += 4; // Margin top for total box
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

    // CHECK IF IMPORTANT NOTE BOX OVERFLOWS CURRENT PAGE
    if (currentY_mm + noteBoxH_mm > pageMaxY_mm) {
      pageContent += `</div>`; // Close current page
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
    </div>`; // Close final billing letterhead page container

    html += pageContent;

    // ----------------------------------------------------
    // DEDICATED CHECKPOINT SHOWCASE PAGES (Page 3+ Normal Plain White Pages)
    // ----------------------------------------------------
    const allShowcases = [];
    selectedItems.forEach(item => {
      if (item.showcase && (item.showcase.description || (item.showcase.photos && item.showcase.photos.length > 0))) {
        allShowcases.push({ name: item.name, showcase: item.showcase, unitPrice: item.unitPrice });
      }
    });

    // Also include function showcases from checkpointShowcases (keys starting with fn_)
    Object.keys(this.checkpointShowcases).forEach(key => {
      if (key.startsWith('fn_')) {
        const sc = this.checkpointShowcases[key];
        if (sc && (sc.description || (sc.photos && sc.photos.length > 0))) {
          allShowcases.push({ name: sc.title || key.replace('fn_', '') + ' Function', showcase: sc, unitPrice: sc.unitPrice || 0 });
        }
      }
    });

    allShowcases.forEach((item, sIdx) => {
      currentPageIndex++;
      const sc = item.showcase;
      const pageId = `wysiwyg-page-${currentPageIndex}`;

      const photoCardsHtml = (sc.photos || []).map((p, pIdx) => `
        <div class="draggable-pdf-element" style="position: absolute; top: ${pIdx * 230}px; left: 0; width: 380px; height: 215px; background: white; border: 1.5px solid #d2e1f5; border-radius: 6px; overflow: hidden; padding: 4px;">
          <span class="drag-handle-badge">✥ Drag Photo ${pIdx + 1}</span>
          <span class="corner-resize-handle">⤢</span>
          <img src="${p.src}" alt="Showcase Photo">
        </div>
      `).join('');

      html += `
        <div class="wysiwyg-a4-page" id="${pageId}" style="padding: 40px 45px; font-family: Inter, sans-serif; background: #ffffff;">
          
          <!-- Top Editable Header Bar -->
          <div class="draggable-pdf-element" style="top: 45px; left: 45px; width: 704px; height: 42px; background: #0056b3; color: white; padding: 10px; border-radius: 4px; text-align: center; font-size: 15px; font-weight: 800;" contenteditable="true">
            <span class="drag-handle-badge">✥ Drag Header</span>
            <span class="corner-resize-handle">⤢</span>
            ${(sc.title || item.name).toUpperCase()}
          </div>

          <!-- Left Side: Draggable & Resizable Description Specifications Box -->
          <div class="draggable-pdf-element" style="top: 105px; left: 45px; width: 300px; height: 930px; background: #f8fafe; border: 1.5px solid #d2e1f5; border-radius: 6px; padding: 16px;" contenteditable="true">
            <span class="drag-handle-badge">✥ Drag Description</span>
            <span class="corner-resize-handle">⤢</span>
            <div style="font-size: 13px; font-weight: 800; color: #0056b3; margin-bottom: 10px;">SETUP SPECIFICATIONS:</div>
            <div style="font-size: 12px; color: #282828; line-height: 1.6; margin-bottom: 18px;">${sc.description || 'Enter custom setup instructions...'}</div>
            <div style="background: white; border: 1.5px solid #0056b3; padding: 10px; border-radius: 4px;">
              <div style="font-size: 10px; font-weight: 700; color: #3c3c3c;">ITEM TOTAL ENTRY:</div>
              <div style="font-size: 15px; font-weight: 800; color: #0088ff;">Rs. ${(sc.unitPrice || item.unitPrice).toLocaleString('en-IN')}</div>
            </div>
          </div>

          <!-- Right Side: Draggable & Resizable Photos Area -->
          <div style="position: absolute; top: 105px; left: 365px; width: 384px; height: 930px;">
            ${photoCardsHtml || `<div style="text-align: center; color: #787878; font-size: 13px; padding-top: 100px;">No photo attachments for this setup.</div>`}
          </div>

        </div>
      `;
    });

    viewport.innerHTML = html;
    this.makePdfElementsDraggable();
  },

  // ROBUST DRAG & RESIZE ENGINE
  makePdfElementsDraggable() {
    const draggables = document.querySelectorAll('.draggable-pdf-element');

    draggables.forEach(el => {
      const dragBadge = el.querySelector('.drag-handle-badge');
      const resizeHandle = el.querySelector('.corner-resize-handle');

      // 1. DRAG MOVING LOGIC
      const initDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX || (e.touches && e.touches[0].clientX);
        const startY = e.clientY || (e.touches && e.touches[0].clientY);

        const rect = el.getBoundingClientRect();
        const parentRect = el.parentElement.getBoundingClientRect();

        const initialLeft = rect.left - parentRect.left;
        const initialTop = rect.top - parentRect.top;

        el.style.position = 'absolute';
        el.classList.add('selected');

        const onMove = (moveEvt) => {
          const currentX = moveEvt.clientX || (moveEvt.touches && moveEvt.touches[0].clientX);
          const currentY = moveEvt.clientY || (moveEvt.touches && moveEvt.touches[0].clientY);

          const deltaX = currentX - startX;
          const deltaY = currentY - startY;

          el.style.left = Math.max(0, (initialLeft + deltaX)) + 'px';
          el.style.top = Math.max(0, (initialTop + deltaY)) + 'px';
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

      if (dragBadge) {
        dragBadge.addEventListener('mousedown', initDrag);
        dragBadge.addEventListener('touchstart', initDrag);
      } else {
        el.addEventListener('mousedown', (e) => {
          if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target === resizeHandle) return;
          initDrag(e);
        });
      }

      // 2. CORNER RESIZING LOGIC
      if (resizeHandle) {
        const initResize = (e) => {
          e.preventDefault();
          e.stopPropagation();

          const startX = e.clientX || (e.touches && e.touches[0].clientX);
          const startY = e.clientY || (e.touches && e.touches[0].clientY);

          const startWidth = el.offsetWidth;
          const startHeight = el.offsetHeight;

          const onResizeMove = (resizeEvt) => {
            const currentX = resizeEvt.clientX || (resizeEvt.touches && resizeEvt.touches[0].clientX);
            const currentY = resizeEvt.clientY || (resizeEvt.touches && resizeEvt.touches[0].clientY);

            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

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

    window.App.showToast('Rendering pixel-perfect PDF from visual canvas...', 'info');

    document.querySelectorAll('.drag-handle-badge, .corner-resize-handle').forEach(b => b.style.display = 'none');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i];
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      if (i > 0) doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
    }

    document.querySelectorAll('.drag-handle-badge, .corner-resize-handle').forEach(b => b.style.display = '');

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

    document.querySelectorAll('.drag-handle-badge, .corner-resize-handle').forEach(b => b.style.display = 'none');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i];
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      if (i > 0) doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
    }

    document.querySelectorAll('.drag-handle-badge, .corner-resize-handle').forEach(b => b.style.display = '');

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
      if (btn && sc && (sc.description || (sc.photos && sc.photos.length > 0))) {
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
    const modalDropzone = document.getElementById('modalDropzone');
    const modalFileInput = document.getElementById('modalFileInput');

    if (modalDropzone && modalFileInput) {
      modalDropzone.addEventListener('click', () => modalFileInput.click());
      modalFileInput.addEventListener('change', (e) => this.handleModalPhotoUpload(e.target.files));

      modalDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        modalDropzone.style.borderColor = 'var(--accent-cyan)';
      });

      modalDropzone.addEventListener('dragleave', () => {
        modalDropzone.style.borderColor = 'var(--border-color)';
      });

      modalDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        modalDropzone.style.borderColor = 'var(--border-color)';
        if (e.dataTransfer.files) {
          this.handleModalPhotoUpload(e.dataTransfer.files);
        }
      });
    }
  }
};
