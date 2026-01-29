// ========== CONFIGURATION ==========
var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // <-- Paste your Google Sheet ID
var BOOKINGS_SHEET = 'Bookings';
var CONFIG_SHEET = 'Config';

// ========== ROOM & AGENT CONSTANTS ==========
var ALL_ROOMS = [
  '101','102','103','104','105',
  '201','202','203','204','205','206',
  '301','302','303','304','305','306',
  '401','402','403'
];

var ROOM_TYPE = {
  '101':'Non-Balcony','102':'Non-Balcony','104':'Non-Balcony','105':'Non-Balcony',
  '201':'Non-Balcony','202':'Non-Balcony','206':'Non-Balcony','303':'Non-Balcony',
  '103':'Balcony','203':'Balcony','204':'Balcony','205':'Balcony',
  '301':'Balcony','302':'Balcony','305':'Balcony','306':'Balcony',
  '304':'Mini Family','401':'Mini Family',
  '402':'Royal Suite Duplex','403':'Royal Suite Duplex'
};

var AGENTS = [
  'Focus','Global','Globe India','Holiday7','Ultimate','Minto',
  'Jatin TA','Himalayan Queen','MMT','My Vacation','MIH',
  'Royal Sunshine','Gyanrachanatour','Self','Walking','AKS',
  'Raisooone','Legendyatri','AKS Office'
];

// ========== WEB APP ENTRY ==========
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('The Neelkanth Grand - CRM')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ========== TEMPLATE INCLUDE ==========
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ========== INITIAL DATA ==========
function getInitialData() {
  var bookings = getAllBookings();
  return {
    bookings: bookings,
    constants: {
      ALL_ROOMS: ALL_ROOMS,
      ROOM_TYPE: ROOM_TYPE,
      AGENTS: AGENTS
    }
  };
}

// ========== INVOICE NUMBER ==========
function getNextInvoiceNo() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(CONFIG_SHEET);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG_SHEET);
      sheet.appendRow(['key', 'value']);
      sheet.appendRow(['invoiceCounter', '0']);
    }
    var data = sheet.getDataRange().getValues();
    var counterRow = -1;
    var counter = 0;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === 'invoiceCounter') {
        counterRow = i + 1;
        counter = parseInt(data[i][1]) || 0;
        break;
      }
    }
    counter++;
    if (counterRow > 0) {
      sheet.getRange(counterRow, 2).setValue(counter);
    } else {
      sheet.appendRow(['invoiceCounter', counter]);
    }
    return 'AKS' + ('0000' + counter).slice(-4);
  } finally {
    lock.releaseLock();
  }
}

// ========== SHEET SETUP HELPER ==========
function setupSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  var bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET);
  if (!bookingsSheet) {
    bookingsSheet = ss.insertSheet(BOOKINGS_SHEET);
  }
  var headers = [
    'id','guestName','phone','pax','kot','roomNo','noOfRooms',
    'roomCategory','checkIn','checkOut','mealPlan','source','sourceName',
    'complimentary','actualRoomRent','totalAmount','paymentType',
    'advanceReceived','advanceDate','paymentMode','balanceReceived',
    'balanceDate','balancePaymentMode','status','remarks','createdAt',
    'rescheduledFrom','checkedIn','checkedInTime','checkedOut',
    'checkedOutTime','kotAmount','addOnsJson'
  ];
  if (bookingsSheet.getLastRow() === 0) {
    bookingsSheet.appendRow(headers);
    bookingsSheet.getRange('I:I').setNumberFormat('@');
    bookingsSheet.getRange('J:J').setNumberFormat('@');
    bookingsSheet.getRange('S:S').setNumberFormat('@');
    bookingsSheet.getRange('V:V').setNumberFormat('@');
  }

  var configSheet = ss.getSheetByName(CONFIG_SHEET);
  if (!configSheet) {
    configSheet = ss.insertSheet(CONFIG_SHEET);
    configSheet.appendRow(['key', 'value']);
    configSheet.appendRow(['invoiceCounter', '0']);
  }

  return 'Setup complete. Bookings sheet has ' + bookingsSheet.getLastRow() + ' rows.';
}
