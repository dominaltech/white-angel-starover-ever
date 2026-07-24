// Manage Tab Logic for White Angel Events Quotation System (Rate Card Master)
window.ManageTab = {
  init() {
    this.renderRatesForm();
  },

  renderRatesForm() {
    const rates = window.StorageManager.getRates();

    // 1. Decoration Rates
    const decContainer = document.getElementById('manageDecorationRates');
    if (decContainer) {
      decContainer.innerHTML = rates.decoration.map((item, idx) => `
        <div class="manage-rate-row">
          <div class="manage-rate-label">
            <span class="manage-rate-badge">${idx + 1}</span>
            <span class="manage-rate-title">${item.name}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="manage-rate-input-group">
              <span class="currency-symbol">₹</span>
              <input type="number" class="form-input rate-dec-input" data-index="${idx}" value="${item.unitPrice}" min="0">
            </div>
            <button type="button" class="rate-delete-btn" onclick="window.ManageTab.deleteRateItem('decoration', ${idx})" title="Delete Item">&times;</button>
          </div>
        </div>
      `).join('');
    }

    // 2. Catering Rates
    const catContainer = document.getElementById('manageCateringRates');
    if (catContainer) {
      let catHtml = `
        <div class="manage-rate-row">
          <div class="manage-rate-label">
            <span class="manage-rate-badge">1</span>
            <span class="manage-rate-title">Veg Plate Rate</span>
          </div>
          <div class="manage-rate-input-group">
            <span class="currency-symbol">₹</span>
            <input type="number" id="rateVegPerPlate" class="form-input" value="${rates.catering.vegPerPlate || 450}" min="0">
          </div>
        </div>
        <div class="manage-rate-row">
          <div class="manage-rate-label">
            <span class="manage-rate-badge">2</span>
            <span class="manage-rate-title">Non-Veg Plate Rate</span>
          </div>
          <div class="manage-rate-input-group">
            <span class="currency-symbol">₹</span>
            <input type="number" id="rateNonVegPerPlate" class="form-input" value="${rates.catering.nonVegPerPlate || 650}" min="0">
          </div>
        </div>
        <div class="manage-rate-row">
          <div class="manage-rate-label">
            <span class="manage-rate-badge">3</span>
            <span class="manage-rate-title">Sweet Item Rate (Per Plate)</span>
          </div>
          <div class="manage-rate-input-group">
            <span class="currency-symbol">₹</span>
            <input type="number" id="rateSweetPerPlate" class="form-input" value="${rates.catering.sweetPerPlate || 80}" min="0">
          </div>
        </div>
        <div class="manage-rate-row">
          <div class="manage-rate-label">
            <span class="manage-rate-badge">4</span>
            <span class="manage-rate-title">Live Counter Unit Rate</span>
          </div>
          <div class="manage-rate-input-group">
            <span class="currency-symbol">₹</span>
            <input type="number" id="rateLiveCounterUnit" class="form-input" value="${rates.catering.liveCounterPerUnit || 5000}" min="0">
          </div>
        </div>
      `;

      if (rates.catering.customItems && Array.isArray(rates.catering.customItems)) {
        rates.catering.customItems.forEach((item, idx) => {
          catHtml += `
            <div class="manage-rate-row">
              <div class="manage-rate-label">
                <span class="manage-rate-badge">${idx + 5}</span>
                <span class="manage-rate-title">${item.name}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="manage-rate-input-group">
                  <span class="currency-symbol">₹</span>
                  <input type="number" class="form-input rate-cat-custom-input" data-index="${idx}" value="${item.unitPrice}" min="0">
                </div>
                <button type="button" class="rate-delete-btn" onclick="window.ManageTab.deleteRateItem('catering_custom', ${idx})" title="Delete Custom Catering Item">&times;</button>
              </div>
            </div>
          `;
        });
      }

      catContainer.innerHTML = catHtml;
    }

    // 3. Photography Rates
    const photoContainer = document.getElementById('managePhotoRates');
    if (photoContainer) {
      photoContainer.innerHTML = rates.photography.map((item, idx) => `
        <div class="manage-rate-row">
          <div class="manage-rate-label">
            <span class="manage-rate-badge">${idx + 1}</span>
            <span class="manage-rate-title">${item.name}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="manage-rate-input-group">
              <span class="currency-symbol">₹</span>
              <input type="number" class="form-input rate-photo-input" data-index="${idx}" value="${item.unitPrice}" min="0">
            </div>
            <button type="button" class="rate-delete-btn" onclick="window.ManageTab.deleteRateItem('photography', ${idx})" title="Delete Item">&times;</button>
          </div>
        </div>
      `).join('');
    }

    // 4. Accommodation & Transport
    if (document.getElementById('ratePerRoom')) document.getElementById('ratePerRoom').value = rates.accommodation.perRoomPrice;

    const transContainer = document.getElementById('manageTransportRates');
    if (transContainer) {
      transContainer.innerHTML = rates.transport.map((item, idx) => `
        <div class="manage-rate-row">
          <div class="manage-rate-label">
            <span class="manage-rate-badge">${idx + 1}</span>
            <span class="manage-rate-title">${item.name}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="manage-rate-input-group">
              <span class="currency-symbol">₹</span>
              <input type="number" class="form-input rate-trans-input" data-index="${idx}" value="${item.unitPrice}" min="0">
            </div>
            <button type="button" class="rate-delete-btn" onclick="window.ManageTab.deleteRateItem('transport', ${idx})" title="Delete Item">&times;</button>
          </div>
        </div>
      `).join('');
    }
  },

  saveRatesFromForm() {
    const rates = window.StorageManager.getRates();

    // Decoration
    document.querySelectorAll('.rate-dec-input').forEach(input => {
      const idx = parseInt(input.getAttribute('data-index'));
      if (rates.decoration[idx]) {
        rates.decoration[idx].unitPrice = parseFloat(input.value) || 0;
      }
    });

    // Catering Base
    rates.catering.vegPerPlate = parseFloat(document.getElementById('rateVegPerPlate')?.value) || 0;
    rates.catering.nonVegPerPlate = parseFloat(document.getElementById('rateNonVegPerPlate')?.value) || 0;
    rates.catering.sweetPerPlate = parseFloat(document.getElementById('rateSweetPerPlate')?.value) || 0;
    rates.catering.liveCounterPerUnit = parseFloat(document.getElementById('rateLiveCounterUnit')?.value) || 0;

    // Catering Custom Items
    if (rates.catering.customItems && Array.isArray(rates.catering.customItems)) {
      document.querySelectorAll('.rate-cat-custom-input').forEach(input => {
        const idx = parseInt(input.getAttribute('data-index'));
        if (rates.catering.customItems[idx]) {
          rates.catering.customItems[idx].unitPrice = parseFloat(input.value) || 0;
        }
      });
    }

    // Photography
    document.querySelectorAll('.rate-photo-input').forEach(input => {
      const idx = parseInt(input.getAttribute('data-index'));
      if (rates.photography[idx]) {
        rates.photography[idx].unitPrice = parseFloat(input.value) || 0;
      }
    });

    // Accommodation & Transport
    rates.accommodation.perRoomPrice = parseFloat(document.getElementById('ratePerRoom')?.value) || 0;

    document.querySelectorAll('.rate-trans-input').forEach(input => {
      const idx = parseInt(input.getAttribute('data-index'));
      if (rates.transport[idx]) {
        rates.transport[idx].unitPrice = parseFloat(input.value) || 0;
      }
    });

    window.StorageManager.saveRates(rates);
    window.App.showToast('Rate Master updated successfully!', 'success');

    // Re-sync Bill Tab form rates
    window.BillTab.renderForm();
    window.BillTab.recalculateTotals();
  },

  resetDefaults() {
    if (confirm('Reset all prices to original default rates?')) {
      window.StorageManager.resetRates();
      this.renderRatesForm();
      window.BillTab.renderForm();
      window.BillTab.recalculateTotals();
      window.App.showToast('Rates reset to default values', 'info');
    }
  },

  addNewRateItem(category) {
    const name = prompt(`Enter name for new ${category} item:`);
    if (!name || !name.trim()) return;
    const priceStr = prompt(`Enter default unit price (₹) for "${name.trim()}":`, '1000');
    if (priceStr === null) return;
    const unitPrice = parseFloat(priceStr) || 0;

    const rates = window.StorageManager.getRates();
    const newItem = {
      id: category.substr(0, 4) + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: name.trim(),
      unitPrice
    };

    if (category === 'decoration') {
      rates.decoration.push(newItem);
    } else if (category === 'photography') {
      rates.photography.push(newItem);
    } else if (category === 'transport') {
      rates.transport.push(newItem);
    } else if (category === 'catering') {
      if (!rates.catering.customItems) rates.catering.customItems = [];
      rates.catering.customItems.push(newItem);
    }

    window.StorageManager.saveRates(rates);
    this.renderRatesForm();
    window.BillTab.renderForm();
    window.BillTab.recalculateTotals();
    window.App.showToast(`Added "${name.trim()}" to ${category.toUpperCase()} Price Master!`, 'success');
  },

  deleteRateItem(category, idx) {
    const rates = window.StorageManager.getRates();
    let itemName = 'Item';

    if (category === 'decoration' && rates.decoration[idx]) {
      itemName = rates.decoration[idx].name;
      if (!confirm(`Delete "${itemName}" from Decoration Price Master?`)) return;
      rates.decoration.splice(idx, 1);
    } else if (category === 'photography' && rates.photography[idx]) {
      itemName = rates.photography[idx].name;
      if (!confirm(`Delete "${itemName}" from Photography Price Master?`)) return;
      rates.photography.splice(idx, 1);
    } else if (category === 'transport' && rates.transport[idx]) {
      itemName = rates.transport[idx].name;
      if (!confirm(`Delete "${itemName}" from Transport Price Master?`)) return;
      rates.transport.splice(idx, 1);
    } else if (category === 'catering_custom' && rates.catering.customItems && rates.catering.customItems[idx]) {
      itemName = rates.catering.customItems[idx].name;
      if (!confirm(`Delete "${itemName}" from Catering Price Master?`)) return;
      rates.catering.customItems.splice(idx, 1);
    }

    window.StorageManager.saveRates(rates);
    this.renderRatesForm();
    window.BillTab.renderForm();
    window.BillTab.recalculateTotals();
    window.App.showToast(`Deleted "${itemName}" from Price Master!`, 'info');
  }
};
