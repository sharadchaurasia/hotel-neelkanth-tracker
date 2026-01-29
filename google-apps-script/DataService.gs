// ========== COLUMN MAP (A=0 .. AG=32) ==========
var COL = {
  id:0, guestName:1, phone:2, pax:3, kot:4, roomNo:5, noOfRooms:6,
  roomCategory:7, checkIn:8, checkOut:9, mealPlan:10, source:11, sourceName:12,
  complimentary:13, actualRoomRent:14, totalAmount:15, paymentType:16,
  advanceReceived:17, advanceDate:18, paymentMode:19, balanceReceived:20,
  balanceDate:21, balancePaymentMode:22, status:23, remarks:24, createdAt:25,
  rescheduledFrom:26, checkedIn:27, checkedInTime:28, checkedOut:29,
  checkedOutTime:30, kotAmount:31, addOnsJson:32
};
var NUM_COLS = 33;

// ========== ROW <-> OBJECT CONVERTERS ==========

function rowToBookingObject(row) {
  return {
    id:               String(row[COL.id] || ''),
    guestName:        String(row[COL.guestName] || ''),
    phone:            String(row[COL.phone] || ''),
    pax:              parseInt(row[COL.pax]) || 1,
    kot:              String(row[COL.kot] || ''),
    roomNo:           String(row[COL.roomNo] || ''),
    noOfRooms:        parseInt(row[COL.noOfRooms]) || 1,
    roomCategory:     String(row[COL.roomCategory] || ''),
    checkIn:          String(row[COL.checkIn] || ''),
    checkOut:         String(row[COL.checkOut] || ''),
    mealPlan:         String(row[COL.mealPlan] || ''),
    source:           String(row[COL.source] || ''),
    sourceName:       String(row[COL.sourceName] || ''),
    complimentary:    String(row[COL.complimentary] || ''),
    actualRoomRent:   parseFloat(row[COL.actualRoomRent]) || 0,
    totalAmount:      parseFloat(row[COL.totalAmount]) || 0,
    paymentType:      String(row[COL.paymentType] || ''),
    advanceReceived:  parseFloat(row[COL.advanceReceived]) || 0,
    advanceDate:      String(row[COL.advanceDate] || ''),
    paymentMode:      String(row[COL.paymentMode] || ''),
    balanceReceived:  parseFloat(row[COL.balanceReceived]) || 0,
    balanceDate:      String(row[COL.balanceDate] || ''),
    balancePaymentMode: String(row[COL.balancePaymentMode] || ''),
    status:           String(row[COL.status] || ''),
    remarks:          String(row[COL.remarks] || ''),
    createdAt:        String(row[COL.createdAt] || ''),
    rescheduledFrom:  String(row[COL.rescheduledFrom] || ''),
    checkedIn:        row[COL.checkedIn] === true || row[COL.checkedIn] === 'true' || row[COL.checkedIn] === 'TRUE',
    checkedInTime:    String(row[COL.checkedInTime] || ''),
    checkedOut:       row[COL.checkedOut] === true || row[COL.checkedOut] === 'true' || row[COL.checkedOut] === 'TRUE',
    checkedOutTime:   String(row[COL.checkedOutTime] || ''),
    kotAmount:        parseFloat(row[COL.kotAmount]) || 0,
    addOns:           parseAddOns(row[COL.addOnsJson])
  };
}

function parseAddOns(jsonStr) {
  if (!jsonStr) return [];
  try {
    var parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function bookingObjectToRow(b) {
  var row = new Array(NUM_COLS);
  row[COL.id]               = b.id || '';
  row[COL.guestName]        = b.guestName || '';
  row[COL.phone]            = b.phone || '';
  row[COL.pax]              = b.pax || 1;
  row[COL.kot]              = b.kot || '';
  row[COL.roomNo]           = b.roomNo || '';
  row[COL.noOfRooms]        = b.noOfRooms || 1;
  row[COL.roomCategory]     = b.roomCategory || '';
  row[COL.checkIn]          = b.checkIn || '';
  row[COL.checkOut]         = b.checkOut || '';
  row[COL.mealPlan]         = b.mealPlan || '';
  row[COL.source]           = b.source || '';
  row[COL.sourceName]       = b.sourceName || '';
  row[COL.complimentary]    = b.complimentary || '';
  row[COL.actualRoomRent]   = b.actualRoomRent || 0;
  row[COL.totalAmount]      = b.totalAmount || 0;
  row[COL.paymentType]      = b.paymentType || '';
  row[COL.advanceReceived]  = b.advanceReceived || 0;
  row[COL.advanceDate]      = b.advanceDate || '';
  row[COL.paymentMode]      = b.paymentMode || '';
  row[COL.balanceReceived]  = b.balanceReceived || 0;
  row[COL.balanceDate]      = b.balanceDate || '';
  row[COL.balancePaymentMode] = b.balancePaymentMode || '';
  row[COL.status]           = b.status || '';
  row[COL.remarks]          = b.remarks || '';
  row[COL.createdAt]        = b.createdAt || '';
  row[COL.rescheduledFrom]  = b.rescheduledFrom || '';
  row[COL.checkedIn]        = b.checkedIn ? 'true' : '';
  row[COL.checkedInTime]    = b.checkedInTime || '';
  row[COL.checkedOut]       = b.checkedOut ? 'true' : '';
  row[COL.checkedOutTime]   = b.checkedOutTime || '';
  row[COL.kotAmount]        = b.kotAmount || 0;
  row[COL.addOnsJson]       = (b.addOns && b.addOns.length > 0) ? JSON.stringify(b.addOns) : '';
  return row;
}

// ========== GET ALL BOOKINGS ==========
function getAllBookings() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(BOOKINGS_SHEET);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, NUM_COLS).getValues();
  var bookings = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i][COL.id]) {
      bookings.push(rowToBookingObject(data[i]));
    }
  }
  return bookings;
}

// ========== SAVE BOOKING (Insert or Update) ==========
function saveBooking(bookingObj) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(BOOKINGS_SHEET);

    if (bookingObj.id) {
      // Try to find existing row
      var rowIndex = findRowById(sheet, bookingObj.id);
      if (rowIndex > 0) {
        // Update existing row
        var rowData = bookingObjectToRow(bookingObj);
        sheet.getRange(rowIndex, 1, 1, NUM_COLS).setValues([rowData]);
        return bookingObj;
      }
    }

    // New booking - generate ID if needed
    if (!bookingObj.id) {
      bookingObj.id = generateBookingIdServer(sheet);
    }
    if (!bookingObj.createdAt) {
      bookingObj.createdAt = new Date().toISOString();
    }

    var rowData = bookingObjectToRow(bookingObj);
    sheet.appendRow(rowData);
    return bookingObj;
  } finally {
    lock.releaseLock();
  }
}

// ========== DELETE BOOKING ==========
function deleteBooking(bookingId) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(BOOKINGS_SHEET);
    var rowIndex = findRowById(sheet, bookingId);
    if (rowIndex > 0) {
      sheet.deleteRow(rowIndex);
      return true;
    }
    return false;
  } finally {
    lock.releaseLock();
  }
}

// ========== HELPERS ==========

function findRowById(sheet, bookingId) {
  if (sheet.getLastRow() <= 1) return -1;
  var ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(bookingId)) {
      return i + 2; // +2 because: 0-indexed + header row
    }
  }
  return -1;
}

function generateBookingIdServer(sheet) {
  var maxNum = 0;
  if (sheet.getLastRow() > 1) {
    var ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      var id = String(ids[i][0]);
      var parts = id.split('-');
      if (parts.length === 2) {
        var num = parseInt(parts[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }
  return 'NKH-' + ('0000' + (maxNum + 1)).slice(-4);
}
