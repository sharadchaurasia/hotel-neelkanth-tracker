// ========== BILL / INVOICE HTML GENERATION ==========

function generateBillHtml(bookingId) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(BOOKINGS_SHEET);
  var rowIndex = findRowById(sheet, bookingId);
  if (rowIndex < 0) return '<h1>Booking not found</h1>';

  var row = sheet.getRange(rowIndex, 1, 1, NUM_COLS).getValues()[0];
  var b = rowToBookingObject(row);
  var invoiceNo = getNextInvoiceNo();

  var nights = calculateNightsServer(b.checkIn, b.checkOut);
  var rooms = parseInt(b.noOfRooms) || 1;
  var totalAmount = parseFloat(b.totalAmount) || 0;

  var baseAmount = Math.round(totalAmount / 1.05 * 100) / 100;
  var cgst = Math.round((totalAmount - baseAmount) / 2 * 100) / 100;
  var sgst = cgst;

  var totalReceived = (parseFloat(b.advanceReceived) || 0) + (parseFloat(b.balanceReceived) || 0);
  var balanceDue = totalAmount - totalReceived;

  var today = formatFullDateServer(new Date());

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<title>Invoice ' + invoiceNo + '</title>' +
    '<style>' +
    '* { margin:0; padding:0; box-sizing:border-box; }' +
    'body { font-family: Arial, sans-serif; color: #1a1a2e; padding: 0; }' +
    '.invoice { max-width: 800px; margin: 0 auto; padding: 40px; }' +
    '.inv-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 24px; }' +
    '.inv-company h1 { font-size: 24px; color: #1e3a5f; margin-bottom: 4px; }' +
    '.inv-company p { font-size: 12px; color: #4b5563; line-height: 1.6; }' +
    '.inv-meta { text-align: right; }' +
    '.inv-meta h2 { font-size: 28px; color: #1e3a5f; margin-bottom: 8px; }' +
    '.inv-meta p { font-size: 13px; color: #4b5563; line-height: 1.6; }' +
    '.inv-meta strong { color: #1f2937; }' +
    '.inv-section { margin-bottom: 24px; }' +
    '.inv-section h3 { font-size: 14px; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }' +
    '.inv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }' +
    '.inv-grid .label { font-size: 12px; color: #6b7280; }' +
    '.inv-grid .val { font-size: 14px; font-weight: 600; color: #1f2937; }' +
    'table { width: 100%; border-collapse: collapse; margin-top: 12px; }' +
    'th { background: #1e3a5f; color: white; padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; }' +
    'td { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }' +
    'tr:nth-child(even) { background: #f9fafb; }' +
    '.text-right { text-align: right; }' +
    '.totals { margin-top: 20px; display: flex; justify-content: flex-end; }' +
    '.totals table { width: 320px; }' +
    '.totals td { font-size: 13px; padding: 8px 14px; }' +
    '.totals .grand { background: #1e3a5f; color: white; font-weight: 700; font-size: 15px; }' +
    '.inv-footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; display: flex; justify-content: space-between; }' +
    '.inv-footer .col { width: 45%; }' +
    '.inv-footer h4 { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }' +
    '.inv-footer p { font-size: 12px; color: #4b5563; line-height: 1.5; }' +
    '.sign-line { margin-top: 60px; border-top: 1px solid #1a1a2e; width: 200px; padding-top: 6px; font-size: 12px; color: #6b7280; }' +
    '@media print { body { padding: 0; } .invoice { padding: 20px; } .no-print { display: none !important; } }' +
    '</style></head><body>' +
    '<div class="invoice">' +

    '<div class="no-print" style="text-align:right;margin-bottom:20px;">' +
    '<button onclick="window.print()" style="padding:10px 24px;background:#1e3a5f;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600;">Print Invoice</button>' +
    '</div>' +

    '<div class="inv-header">' +
    '<div class="inv-company">' +
    '<h1>The Neelkanth Grand</h1>' +
    '<p><strong>AKS Hospitality</strong><br>' +
    'Neelkanth Grand, Naggar Road, Manali,<br>Himachal Pradesh<br>' +
    'Contact: 8922032843 | 9838888878<br>' +
    'Sales Office: 912A, 9th Floor, Bhutani Alphatum,<br>Sector 90, Noida<br>' +
    'GSTIN: 02ACAFA1060C1ZI</p>' +
    '</div>' +
    '<div class="inv-meta">' +
    '<h2>INVOICE</h2>' +
    '<p>Invoice No: <strong>' + invoiceNo + '</strong><br>' +
    'Date: <strong>' + today + '</strong><br>' +
    'Booking ID: <strong>' + escapeHtmlServer(b.id) + '</strong></p>' +
    '</div>' +
    '</div>' +

    '<div class="inv-section">' +
    '<h3>Guest Details</h3>' +
    '<div class="inv-grid">' +
    '<div><div class="label">Guest Name</div><div class="val">' + escapeHtmlServer(b.guestName) + '</div></div>' +
    '<div><div class="label">Phone</div><div class="val">' + escapeHtmlServer(b.phone || '-') + '</div></div>' +
    '<div><div class="label">Pax</div><div class="val">' + (b.pax || 1) + '</div></div>' +
    '<div><div class="label">Room(s)</div><div class="val">' + escapeHtmlServer(b.roomNo) + (b.roomCategory ? ' (' + escapeHtmlServer(b.roomCategory) + ')' : '') + '</div></div>' +
    '<div><div class="label">Check-in</div><div class="val">' + formatFullDateServer(parseDateStr(b.checkIn)) + '</div></div>' +
    '<div><div class="label">Check-out</div><div class="val">' + formatFullDateServer(parseDateStr(b.checkOut)) + '</div></div>' +
    '<div><div class="label">Nights</div><div class="val">' + nights + '</div></div>' +
    '<div><div class="label">Plan</div><div class="val">' + escapeHtmlServer(b.mealPlan || '-') + '</div></div>' +
    '</div>' +
    '</div>' +

    '<div class="inv-section">' +
    '<h3>Charges</h3>' +
    '<table><thead><tr>' +
    '<th>Description</th><th class="text-right">Nights</th><th class="text-right">Rooms</th><th class="text-right">Amount</th>' +
    '</tr></thead><tbody>' +
    '<tr><td>Room Charges' + (b.roomCategory ? ' (' + escapeHtmlServer(b.roomCategory) + ')' : '') + '</td>' +
    '<td class="text-right">' + nights + '</td>' +
    '<td class="text-right">' + rooms + '</td>' +
    '<td class="text-right">' + formatCurrencyServer(baseAmount) + '</td></tr>' +
    (b.complimentary ? '<tr><td>Add-On: ' + escapeHtmlServer(b.complimentary) + '</td><td></td><td></td><td class="text-right">-</td></tr>' : '') +
    (b.kotAmount ? '<tr><td>KOT Charges</td><td></td><td></td><td class="text-right">' + formatCurrencyServer(b.kotAmount) + '</td></tr>' : '') +
    buildAddOnRows(b.addOns) +
    '</tbody></table>' +
    '</div>' +

    '<div class="totals"><table>' +
    '<tr><td>Subtotal</td><td class="text-right">' + formatCurrencyServer(baseAmount) + '</td></tr>' +
    '<tr><td>CGST @ 2.5%</td><td class="text-right">' + formatCurrencyServer(cgst) + '</td></tr>' +
    '<tr><td>SGST @ 2.5%</td><td class="text-right">' + formatCurrencyServer(sgst) + '</td></tr>' +
    '<tr class="grand"><td>Grand Total (incl. GST 5%)</td><td class="text-right">' + formatCurrencyServer(totalAmount) + '</td></tr>' +
    '<tr><td>Amount Received</td><td class="text-right" style="color:#10b981;font-weight:600">' + formatCurrencyServer(totalReceived) + '</td></tr>' +
    (balanceDue > 0 ? '<tr><td><strong>Balance Due</strong></td><td class="text-right" style="color:#ef4444;font-weight:700">' + formatCurrencyServer(balanceDue) + '</td></tr>' : '') +
    '</table></div>' +

    '<div class="inv-footer">' +
    '<div class="col">' +
    '<h4>Payment Info</h4>' +
    '<p>Payment Type: ' + escapeHtmlServer(b.paymentType) + '<br>' +
    'Mode: ' + escapeHtmlServer(b.paymentMode || '-') + '<br>' +
    'Source: ' + escapeHtmlServer(b.source) + (b.sourceName ? ' (' + escapeHtmlServer(b.sourceName) + ')' : '') + '</p>' +
    '</div>' +
    '<div class="col" style="text-align:right">' +
    '<div class="sign-line">Authorized Signatory<br><strong>AKS Hospitality</strong></div>' +
    '</div>' +
    '</div>' +

    '<p style="text-align:center;margin-top:30px;font-size:11px;color:#9ca3af;">Thank you for staying with us! | The Neelkanth Grand | AKS Hospitality</p>' +

    '</div></body></html>';

  return html;
}

// ========== SERVER-SIDE HELPERS ==========

function buildAddOnRows(addOns) {
  if (!addOns || addOns.length === 0) return '';
  var html = '';
  for (var i = 0; i < addOns.length; i++) {
    html += '<tr><td>Add-On: ' + escapeHtmlServer(addOns[i].type || 'Other') +
      '</td><td></td><td></td><td class="text-right">' +
      formatCurrencyServer(addOns[i].amount || 0) + '</td></tr>';
  }
  return html;
}

function calculateNightsServer(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  var d1 = parseDateStr(checkIn);
  var d2 = parseDateStr(checkOut);
  var diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}

function parseDateStr(str) {
  if (!str) return new Date();
  var parts = String(str).split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return new Date(str);
}

function formatFullDateServer(date) {
  if (!date || !(date instanceof Date)) return '-';
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var d = date.getDate();
  var m = months[date.getMonth()];
  var y = date.getFullYear();
  return (d < 10 ? '0' : '') + d + ' ' + m + ' ' + y;
}

function formatCurrencyServer(amount) {
  var num = Number(amount || 0);
  return '\u20B9' + num.toLocaleString('en-IN');
}

function escapeHtmlServer(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
