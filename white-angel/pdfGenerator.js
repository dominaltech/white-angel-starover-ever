// PDF Generator for White Angel Events
// Page 1: Cover Page (cover_page.jpg)
// Page 2: Quotation Letterhead (letterhead_template.jpg) ONLY for Page 2 with dynamic Header/Footer settings
// Page 3+: Dedicated Checkpoint Showcase Pages (Title top, Description left, Photos right) or custom saved visual canvas pages

window.PdfGenerator = {
  async generatePdf(quotationData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

    const loadImage = (src) => new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

    const assets = window.IMAGE_ASSETS || {};

    const [logoImg, coverImg, letterheadImg] = await Promise.all([
      loadImage(assets.logo || 'assets/logo.jpg'),
      loadImage(assets.coverPage || 'assets/cover_page.jpg'),
      loadImage(assets.letterhead || 'assets/letterhead_template.jpg')
    ]);

    const formatRs = (val) => {
      const num = Number(val) || 0;
      return 'Rs. ' + num.toLocaleString('en-IN');
    };

    const letterhead = quotationData.letterhead || {
      phoneText: '8149634555 / 9028776555',
      addressText: '17 East, Ayodhya Nagar, Majrewadi, Solapur 413003',
      taglineText: 'Solapur | Pune | Osmanabad | Umarga | Bijapur',
      headerTitle: 'EVENT REQUIREMENT QUOTATION'
    };

    // ----------------------------------------------------
    // PAGE 1: COVER PAGE (Exact cover page graphic)
    // ----------------------------------------------------
    if (coverImg) {
      doc.addImage(coverImg, 'JPEG', 0, 0, pageWidth, pageHeight);
    } else {
      doc.setFillColor(11, 15, 25);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      if (logoImg) doc.addImage(logoImg, 'JPEG', (pageWidth - 70) / 2, 30, 70, 45);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text("WHITE ANGEL EVENTS", pageWidth / 2, 90, { align: 'center' });
    }

    const groom = quotationData.clientDetails.groomName || '';
    const bride = quotationData.clientDetails.brideName || '';
    const clientTitle = [groom, bride].filter(Boolean).join(' & ') || 'VALUED CLIENT';

    doc.setFillColor(11, 15, 25);
    doc.setDrawColor(0, 210, 255);
    doc.setLineWidth(0.6);
    doc.roundedRect(15, pageHeight - 34, pageWidth - 30, 14, 3, 3, 'FD');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`EVENT QUOTATION FOR: ${clientTitle.toUpperCase()}`, pageWidth / 2, pageHeight - 27, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 210, 255);
    doc.text(`Date Issued: ${new Date().toLocaleDateString('en-IN')}  |  Quote Ref: #${quotationData.id}`, pageWidth / 2, pageHeight - 22, { align: 'center' });


    // ----------------------------------------------------
    // PAGE 2: QUOTATION LETTERHEAD (With Editable Letterhead Header/Footer)
    // ----------------------------------------------------
    doc.addPage(); // Page 2
    if (letterheadImg) {
      doc.addImage(letterheadImg, 'JPEG', 0, 0, pageWidth, pageHeight);
    } else {
      doc.setFillColor(15, 22, 38);
      doc.rect(0, 0, pageWidth, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("WHITE ANGEL EVENTS", 15, 16);
    }

    let extraHeaderY = 12;
    if (letterhead.phoneText) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 86, 179);
      doc.text(`Contact: ${letterhead.phoneText}`, pageWidth - 14, extraHeaderY, { align: 'right' });
      extraHeaderY += 4.5;
    }
    if (letterhead.addressText) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(`${letterhead.addressText}`, pageWidth - 14, extraHeaderY, { align: 'right' });
      extraHeaderY += 4;
    }
    if (letterhead.extraInfoLines && Array.isArray(letterhead.extraInfoLines)) {
      letterhead.extraInfoLines.forEach(infoText => {
        if (infoText && infoText.trim()) {
          doc.setFontSize(6.8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 86, 179);
          doc.text(infoText.trim(), pageWidth - 14, extraHeaderY, { align: 'right' });
          extraHeaderY += 3.8;
        }
      });
    }

    let yPos = 48;

    // 1. Client & Event Info Box
    doc.setFillColor(248, 250, 254);
    doc.setDrawColor(0, 86, 179);
    doc.setLineWidth(0.4);
    doc.roundedRect(12, yPos, pageWidth - 24, 42, 2, 2, 'FD');

    doc.setTextColor(15, 22, 38);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    const col1X = 16;
    const col2X = 110;

    doc.text(`Groom's Name: ${quotationData.clientDetails.groomName || '-'}`, col1X, yPos + 7);
    doc.text(`Bride's Name: ${quotationData.clientDetails.brideName || '-'}`, col1X, yPos + 13);
    doc.text(`Mobile No: ${quotationData.clientDetails.mobileNumber || '-'}`, col1X, yPos + 19);
    doc.text(`Address: ${quotationData.clientDetails.address || '-'}`, col1X, yPos + 25);

    doc.text(`Event Date: ${quotationData.eventDetails.weddingDate || '-'}`, col2X, yPos + 7);
    doc.text(`Venue Name: ${quotationData.eventDetails.venueName || '-'}`, col2X, yPos + 13);
    doc.text(`Guest Count: ${quotationData.eventDetails.guestCount || '-'}`, col2X, yPos + 19);
    doc.text(`Event Time: ${quotationData.eventDetails.eventTime || '-'}`, col2X, yPos + 25);

    const functionsStr = (quotationData.selectedFunctions && quotationData.selectedFunctions.length > 0)
      ? quotationData.selectedFunctions.join(', ')
      : 'Wedding Event';

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(210, 225, 245);
    doc.setLineWidth(0.4);
    doc.roundedRect(13, yPos + 29, pageWidth - 26, 11, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 86, 179);
    doc.text(`EVENT / FUNCTION TYPE(S): ${functionsStr.toUpperCase()}`, col1X, yPos + 36);

    yPos += 48;


    // 2. Itemized Requirements & Billing Table
    const tableHeaderHeight = 8;
    const rowHeight = 7.5;
    const page2MaxY = 250;

    const drawTableHeader = (y) => {
      doc.setFillColor(0, 86, 179);
      doc.rect(12, y, pageWidth - 24, tableHeaderHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("DESCRIPTION / REQUIREMENT", 16, y + 5.5);
      doc.text("QTY", 125, y + 5.5, { align: 'center' });
      doc.text("RATE (Rs.)", 156, y + 5.5, { align: 'right' });
      doc.text("TOTAL (Rs.)", 193, y + 5.5, { align: 'right' });
    };

    drawTableHeader(yPos);
    yPos += tableHeaderHeight;

    let calculatedSubtotal = 0;
    let rowIndex = 0;

    const selectedItems = (quotationData.items || []).filter(item => item.selected);

    selectedItems.forEach((item) => {
      if (yPos + rowHeight > (doc.internal.getNumberOfPages() === 2 ? page2MaxY : 270)) {
        doc.addPage();
        yPos = 16;
        drawTableHeader(yPos);
        yPos += tableHeaderHeight;
      }

      if (rowIndex % 2 === 1) {
        doc.setFillColor(248, 250, 253);
        doc.rect(12, yPos, pageWidth - 24, rowHeight, 'F');
      }

      doc.setDrawColor(230, 235, 245);
      doc.line(12, yPos + rowHeight, pageWidth - 12, yPos + rowHeight);

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');

      const itemName = item.name.length > 44 ? item.name.substring(0, 41) + '...' : item.name;
      doc.text(itemName, 16, yPos + 5);

      doc.text(String(item.quantity || 1), 125, yPos + 5, { align: 'center' });

      const unitPriceStr = (item.unitPrice || 0).toLocaleString('en-IN');
      doc.text(unitPriceStr, 156, yPos + 5, { align: 'right' });

      const lineTotal = (item.quantity || 1) * (item.unitPrice || 0);
      calculatedSubtotal += lineTotal;
      doc.text(lineTotal.toLocaleString('en-IN'), 193, yPos + 5, { align: 'right' });

      yPos += rowHeight;
      rowIndex++;
    });


    // 3. Financial Summary Box
    const discountPercent = Number(quotationData.payment?.discountPercent) || 0;
    const discountAmount = Math.round((calculatedSubtotal * discountPercent) / 100);
    const grandTotal = Math.max(0, calculatedSubtotal - discountAmount);
    const advancePaid = Number(quotationData.payment?.advancePaid) || 0;
    const balanceAmount = grandTotal - advancePaid;

    const hasDiscount = discountPercent > 0;
    const boxH = hasDiscount ? 36 : 28;

    if (yPos + boxH + 6 > (doc.internal.getNumberOfPages() === 2 ? page2MaxY : 270)) {
      doc.addPage();
      yPos = 16;
    }

    yPos += 4;
    const boxX = 95;
    const boxW = 103;

    doc.setFillColor(240, 244, 250);
    doc.setDrawColor(0, 86, 179);
    doc.setLineWidth(0.5);
    doc.roundedRect(boxX, yPos, boxW, boxH, 2, 2, 'FD');

    doc.setTextColor(15, 22, 38);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');

    const rightValX = boxX + boxW - 10;

    if (hasDiscount) {
      doc.text("SUBTOTAL:", boxX + 4, yPos + 7);
      doc.text(formatRs(calculatedSubtotal), rightValX, yPos + 7, { align: 'right' });

      doc.setTextColor(0, 102, 204);
      doc.text(`DISCOUNT (${discountPercent}%):`, boxX + 4, yPos + 14);
      doc.text(`- ${formatRs(discountAmount)}`, rightValX, yPos + 14, { align: 'right' });

      doc.setTextColor(15, 22, 38);
      doc.setFontSize(9);
      doc.text("GRAND TOTAL:", boxX + 4, yPos + 21);
      doc.text(formatRs(grandTotal), rightValX, yPos + 21, { align: 'right' });

      doc.setFontSize(8.5);
      doc.text("ADVANCE PAID:", boxX + 4, yPos + 28);
      doc.setTextColor(0, 140, 0);
      doc.text(formatRs(advancePaid), rightValX, yPos + 28, { align: 'right' });

      doc.setTextColor(200, 0, 0);
      doc.setFontSize(9);
      doc.text("BALANCE AMOUNT:", boxX + 4, yPos + 33);
      doc.text(formatRs(balanceAmount), rightValX, yPos + 33, { align: 'right' });
    } else {
      doc.text("GRAND TOTAL:", boxX + 4, yPos + 7);
      doc.text(formatRs(grandTotal), rightValX, yPos + 7, { align: 'right' });

      doc.text("ADVANCE PAID:", boxX + 4, yPos + 15);
      doc.setTextColor(0, 140, 0);
      doc.text(formatRs(advancePaid), rightValX, yPos + 15, { align: 'right' });

      doc.setTextColor(200, 0, 0);
      doc.text("BALANCE AMOUNT:", boxX + 4, yPos + 23);
      doc.text(formatRs(balanceAmount), rightValX, yPos + 23, { align: 'right' });
    }


    // 4. Special Instructions & Important Note
    yPos += boxH + 6;
    if (yPos + 24 > (doc.internal.getNumberOfPages() === 2 ? page2MaxY : 270)) {
      doc.addPage();
      yPos = 16;
    }

    if (quotationData.specialInstructions) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 86, 179);
      doc.text("SPECIAL INSTRUCTIONS:", 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const splitLines = doc.splitTextToSize(quotationData.specialInstructions, pageWidth - 28);
      doc.text(splitLines, 14, yPos + 4.5);
      yPos += (splitLines.length * 4) + 6;
    }

    // Important Note Box
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(248, 113, 113);
    doc.roundedRect(12, yPos, pageWidth - 24, 11, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text("IMPORTANT NOTE: 80% PAYMENT MUST BE PAID 15 DAYS BEFORE OF EVENT.", pageWidth / 2, yPos + 6.5, { align: 'center' });


    // ----------------------------------------------------
    // DEDICATED SHOWCASE PAGES (Page 3+ Saved After Total Box)
    // PIXEL-PERFECT VISUAL CANVAS RENDERING ENGINE
    // ----------------------------------------------------
    const allShowcases = [];

    // 1. Service Items Showcase
    selectedItems.forEach(item => {
      if (item.showcase && (item.showcase.description || (item.showcase.photos && item.showcase.photos.length > 0) || item.showcase.savedCanvasHtml || (item.showcase.pages && item.showcase.pages.length > 0))) {
        allShowcases.push({ name: item.name, showcase: item.showcase, unitPrice: item.unitPrice });
      }
    });

    // 2. Function Details Showcase
    if (quotationData.functionShowcases) {
      Object.keys(quotationData.functionShowcases).forEach(key => {
        if (key.startsWith('fn_')) {
          const sc = quotationData.functionShowcases[key];
          if (sc && (sc.description || (sc.photos && sc.photos.length > 0) || sc.savedCanvasHtml || (sc.pages && sc.pages.length > 0))) {
            allShowcases.push({ name: sc.title || key.replace('fn_', '') + ' Function', showcase: sc, unitPrice: sc.unitPrice || 0 });
          }
        }
      });
    }

    for (let sIdx = 0; sIdx < allShowcases.length; sIdx++) {
      const item = allShowcases[sIdx];
      const sc = item.showcase;

      if (sc && sc.savedCanvasHtml) {
        // Render EXACT visual canvas pages saved by user!
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = 'position: fixed; left: -9999px; top: -9999px; width: 794px; z-index: -9999;';
        tempDiv.innerHTML = sc.savedCanvasHtml;
        document.body.appendChild(tempDiv);

        // Hide badges, resize handles, and delete buttons before rendering canvas
        tempDiv.querySelectorAll('.drag-handle-badge, .corner-resize-handle, .page-delete-btn, .helper-dropzone').forEach(b => b.style.display = 'none');

        const pages = tempDiv.querySelectorAll('.wysiwyg-a4-page');
        for (let pIdx = 0; pIdx < pages.length; pIdx++) {
          const pageEl = pages[pIdx];
          const canvas = await html2canvas(pageEl, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          doc.addPage();
          doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
        }

        document.body.removeChild(tempDiv);
      } else {
        // Fallback standard layout renderer
        let itemPages = sc.pages && sc.pages.length > 0 ? sc.pages : null;
        const photos = sc.photos || [];

        if (!itemPages) {
          const totalPagesCount = Math.max(1, Math.ceil(photos.length / 4));
          itemPages = [];
          for (let p = 0; p < totalPagesCount; p++) {
            itemPages.push({
              pageNum: p + 1,
              title: sc.title || item.name,
              description: p === 0 ? sc.description : '',
              photos: photos.slice(p * 4, (p + 1) * 4)
            });
          }
        }

        for (let pIdx = 0; pIdx < itemPages.length; pIdx++) {
          const pageData = itemPages[pIdx];
          doc.addPage();

          doc.setFillColor(0, 86, 179);
          doc.rect(12, 12, pageWidth - 24, 10, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10.5);
          doc.setFont('helvetica', 'bold');
          const pageTitle = (pageData.title || sc.title || item.name).toUpperCase();
          doc.text(pageTitle, pageWidth / 2, 18.5, { align: 'center' });

          const leftX = 12;
          const leftW = 80;
          const topY = 26;

          doc.setFillColor(248, 250, 254);
          doc.setDrawColor(210, 225, 245);
          doc.setLineWidth(0.4);
          doc.roundedRect(leftX, topY, leftW, pageHeight - 40, 2, 2, 'FD');

          doc.setTextColor(0, 86, 179);
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'bold');
          doc.text("SETUP SPECIFICATIONS:", leftX + 4, topY + 8);

          let descY = topY + 14;
          const descText = pageData.description || (pIdx === 0 ? sc.description : '');

          if (descText) {
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            const splitDesc = doc.splitTextToSize(descText, leftW - 8);
            doc.text(splitDesc, leftX + 4, descY);
            descY += (splitDesc.length * 4.5) + 6;
          }

          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(0, 86, 179);
          doc.roundedRect(leftX + 4, descY, leftW - 8, 14, 2, 2, 'FD');

          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(60, 60, 60);
          doc.text("ITEM TOTAL ENTRY:", leftX + 8, descY + 5.5);
          doc.setFontSize(10);
          doc.setTextColor(0, 136, 255);
          doc.text(formatRs(sc.unitPrice || item.unitPrice), leftX + 8, descY + 10.5);

          const rightX = 96;
          const rightW = 102;
          const pagePhotos = pageData.photos || [];

          if (pagePhotos.length === 0) {
            doc.setFillColor(248, 250, 254);
            doc.setDrawColor(210, 225, 245);
            doc.roundedRect(rightX, topY, rightW, pageHeight - 40, 2, 2, 'FD');
            doc.setTextColor(120, 120, 120);
            doc.setFontSize(9);
            doc.text("No photo attachments for this setup page.", rightX + rightW / 2, topY + 40, { align: 'center' });
          } else {
            const maxPhotos = Math.min(4, pagePhotos.length);
            const pHeight = maxPhotos > 2 ? 60 : 120;

            for (let photoIdx = 0; photoIdx < maxPhotos; photoIdx++) {
              const photo = pagePhotos[photoIdx];
              const pY = topY + (photoIdx * (pHeight + 4));

              doc.setFillColor(248, 250, 254);
              doc.setDrawColor(210, 225, 245);
              doc.setLineWidth(0.4);
              doc.roundedRect(rightX, pY, rightW, pHeight, 2, 2, 'FD');

              try {
                if (photo.src && typeof photo.src === 'string' && photo.src.startsWith('data:image/')) {
                  const fmt = photo.src.includes('data:image/png') ? 'PNG' : 'JPEG';
                  doc.addImage(photo.src, fmt, rightX + 2, pY + 2, rightW - 4, pHeight - 4);
                } else {
                  const loaded = await loadImage(photo.src);
                  if (loaded) {
                    doc.addImage(loaded, 'JPEG', rightX + 2, pY + 2, rightW - 4, pHeight - 4);
                  }
                }
              } catch (err) {
                console.error('Error adding photo to PDF showcase page:', err);
              }
            }
          }
        }
      }
    }

    return doc;
  }
};
