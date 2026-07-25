// Summary Tab Logic for White Angel Events Quotation System
window.SummaryTab = {
  init() {
    this.loadQuotations();
  },

  loadQuotations() {
    const container = document.getElementById('savedQuotesGrid');
    if (!container) return;

    const searchTerm = (document.getElementById('summarySearchInput')?.value || '').toLowerCase().trim();
    let quotes = window.StorageManager.getQuotations();

    if (searchTerm) {
      quotes = quotes.filter(q => {
        const clientName = `${q.clientDetails?.groomName || ''} ${q.clientDetails?.brideName || ''}`.toLowerCase();
        const phone = (q.clientDetails?.mobileNumber || '').toLowerCase();
        const venue = (q.eventDetails?.venueName || '').toLowerCase();
        const id = String(q.id || '').toLowerCase();

        return clientName.includes(searchTerm) || phone.includes(searchTerm) || venue.includes(searchTerm) || id.includes(searchTerm);
      });
    }

    if (quotes.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px; background: rgba(255,255,255,0.02); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px;"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
          <div style="font-size: 1.1rem; font-weight: 600;">No Saved Quotations Found</div>
          <div style="font-size: 0.85rem; margin-top: 4px;">Fill out the Bill tab and click 'Generate PDF' or 'Send on WhatsApp' to save quotes here.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = quotes.map(q => this.createQuoteCardHtml(q)).join('');
  },

  createQuoteCardHtml(q) {
    const groom = q.clientDetails?.groomName || '';
    const bride = q.clientDetails?.brideName || '';
    const clientName = [groom, bride].filter(Boolean).join(' & ') || 'Unnamed Client';
    const date = q.eventDetails?.weddingDate || 'Date Not Set';
    const venue = q.eventDetails?.venueName || 'Venue Not Set';
    const phone = q.clientDetails?.mobileNumber || 'N/A';
    const photoCount = q.images?.length || 0;
    const functions = (q.selectedFunctions || []).join(', ') || 'Wedding Event';

    const grandTotal = q.payment?.grandTotal || 0;
    const advance = q.payment?.advancePaid || 0;
    const balance = q.payment?.balanceAmount || (grandTotal - advance);
    const discountPercent = q.payment?.discountPercent || 0;

    return `
      <div class="quote-card" data-id="${q.id}">
        <div class="quote-card-header">
          <div>
            <span class="quote-card-id">Quote #${q.id}</span>
            <h3 class="quote-card-title">${clientName}</h3>
          </div>
          <span class="badge-tag">${functions.split(',')[0]}</span>
        </div>

        <div class="quote-card-body">
          <div class="quote-info-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
            <span>${phone}</span>
          </div>

          <div class="quote-info-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>${date} (${venue})</span>
          </div>

          <div class="quote-info-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>${photoCount} Concept Photos Attached</span>
          </div>

          <div style="margin-top: 10px; background: rgba(0,0,0,0.04); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">TOTAL BILL ${discountPercent > 0 ? `(${discountPercent}% OFF)` : ''}</div>
              <div style="font-size: 1rem; font-weight: 700; color: var(--accent-cyan);">Rs. ${grandTotal.toLocaleString('en-IN')}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.7rem; color: var(--text-muted);">BALANCE DUE</div>
              <div style="font-size: 1rem; font-weight: 700; color: #ef4444;">Rs. ${balance.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        <div class="quote-card-actions">
          <button type="button" class="card-action-btn primary" onclick="window.SummaryTab.editQuotation('${q.id}')" title="Edit Quotation">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 3px;"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
          </button>

          <button type="button" class="card-action-btn secondary" onclick="window.SummaryTab.regeneratePdf('${q.id}')" title="Download PDF">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 3px;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF
          </button>

          <button type="button" class="card-action-btn whatsapp" onclick="window.SummaryTab.shareWhatsApp('${q.id}')" title="Share PDF via WhatsApp">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 3px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.573-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/></svg> Share PDF
          </button>

          <button type="button" class="card-action-btn danger" onclick="window.SummaryTab.deleteQuotation('${q.id}')" title="Delete Record">
            &times; Delete
          </button>
        </div>
      </div>
    `;
  },

  editQuotation(id) {
    const q = window.StorageManager.getQuotationById(id);
    if (q && window.BillTab) {
      window.BillTab.loadQuotationForEdit(q);
    }
  },

  async regeneratePdf(id) {
    const q = window.StorageManager.getQuotationById(id);
    if (!q) return;

    window.App.showToast(`Generating PDF for Quote #${q.id}...`, 'info');
    try {
      const doc = await window.PdfGenerator.generatePdf(q);
      const clientName = [q.clientDetails?.groomName, q.clientDetails?.brideName].filter(Boolean).join('_') || 'Client';
      doc.save(`White_Angel_Quotation_${clientName}_No${q.id}.pdf`);
      window.App.showToast('PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.App.showToast('Error generating PDF', 'error');
    }
  },

  // Share Actual PDF Document File on WhatsApp
  async shareWhatsApp(id) {
    const q = window.StorageManager.getQuotationById(id);
    if (!q) return;

    window.App.showToast(`Generating PDF file for Quote #${q.id}...`, 'info');

    try {
      const doc = await window.PdfGenerator.generatePdf(q);
      const clientName = [q.clientDetails?.groomName, q.clientDetails?.brideName].filter(Boolean).join('_') || 'Client';
      const filename = `White_Angel_Quotation_${clientName}_No${q.id}.pdf`;

      const pdfArrayBuffer = doc.output('arraybuffer');
      const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      const phone = (q.clientDetails?.mobileNumber || '').replace(/\D/g, '');

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `White Angel Events Quotation #${q.id}`,
          text: `White Angel Events Quotation for ${clientName}`
        });
        window.App.showToast('PDF file shared directly to WhatsApp!', 'success');
      } else {
        doc.save(filename);
        const whatsappUrl = phone ? `https://wa.me/91${phone}` : `https://wa.me/`;
        window.open(whatsappUrl, '_blank');
        window.App.showToast('PDF downloaded! Please attach it in the opened WhatsApp chat.', 'info');
      }
    } catch (err) {
      console.error('Error sharing PDF on WhatsApp:', err);
    }
  },

  deleteQuotation(id) {
    if (confirm(`Are you sure you want to delete quotation #${id}?`)) {
      window.StorageManager.deleteQuotation(id);
      this.loadQuotations();
      window.App.showToast(`Quotation #${id} deleted`, 'info');
    }
  }
};
