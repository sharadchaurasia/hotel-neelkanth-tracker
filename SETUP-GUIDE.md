# Hotel Neelkanth - Collection Tracker Setup Guide

## Overview
A professional web app for tracking hotel collections, built on Google Apps Script.

**Features:**
- Dashboard with today's checkouts & pending amounts
- Add/Edit/Delete bookings
- Track Prepaid, Postpaid, Ledger payments
- Agent ledger summary
- Filter by date, status, payment type
- Works on phone & computer
- Data stored in Google Sheets
- Shareable with staff

---

## Step-by-Step Setup (10 minutes)

### Step 1: Open Google Apps Script

1. Go to: **https://script.google.com**
2. Sign in with your Gmail account
3. Click **"New Project"** (top left)

---

### Step 2: Add the Code

**File 1: Code.gs**
1. You'll see a file called `Code.gs` already open
2. Delete any existing code
3. Open this file on your Mac:
   ```
   /Users/sharadchaurasia/Documents/sharad/hotel-neelkanth-tracker/google-apps-script/Code.gs
   ```
4. Copy ALL the code and paste into Code.gs

**File 2: Index.html**
1. Click **File → New → HTML**
2. Name it: `Index` (exactly this name)
3. Delete any existing code
4. Open this file on your Mac:
   ```
   /Users/sharadchaurasia/Documents/sharad/hotel-neelkanth-tracker/google-apps-script/Index.html
   ```
5. Copy ALL the code and paste into Index.html

---

### Step 3: Save & Name Project

1. Click on "Untitled project" at the top
2. Name it: **Hotel Neelkanth Tracker**
3. Press **Ctrl+S** (or Cmd+S on Mac) to save

---

### Step 4: Deploy as Web App

1. Click **Deploy** (top right) → **New deployment**
2. Click the ⚙️ gear icon → Select **Web app**
3. Fill in:
   - **Description:** Collection Tracker v1
   - **Execute as:** Me
   - **Who has access:** Anyone (or "Anyone with Google account" for security)
4. Click **Deploy**
5. Click **Authorize access** → Select your Gmail → Allow permissions
6. **Copy the Web App URL** - this is your app link!

---

### Step 5: Open Your App

1. Paste the URL in your browser
2. Your collection tracker is live! 🎉

---

## How to Use

### Add New Booking
1. Click **+ New Booking**
2. Fill in guest details, room, dates
3. Select source (Walk-in / OTA / Agent)
4. Enter amount and payment type
5. Click **Save Booking**

### Collect Payment
1. Find the booking with pending amount
2. Click **Collect** button
3. Enter amount received
4. Select payment mode
5. Click **Collect**

### View Today's Pending
1. Click **Today's Pending** button
2. Shows all checkouts today with pending payments

### View Agent Ledger
1. Ledger summary shows automatically
2. See how much each agent owes

### View/Edit Spreadsheet
1. Click **View Sheet** to open Google Sheets directly
2. All data is stored there

---

## Share with Staff

1. Open the Google Sheet (click View Sheet)
2. Click **Share** button
3. Add staff email addresses
4. They can access the same web app URL

---

## Access on Phone

1. Open the Web App URL in phone browser
2. **Tip:** Add to home screen for app-like access:
   - **iPhone:** Safari → Share → Add to Home Screen
   - **Android:** Chrome → Menu → Add to Home Screen

---

## Troubleshooting

### "Authorization required" error
- Click the link and authorize with your Gmail

### "Script function not found" error
- Make sure Index.html is named exactly `Index` (not Index.html)

### Data not showing
- Wait a few seconds for first load
- Click Refresh button

### Changes not saving
- Check internet connection
- Re-authorize if needed

---

## Files Location

All code files are saved at:
```
/Users/sharadchaurasia/Documents/sharad/hotel-neelkanth-tracker/google-apps-script/
├── Code.gs      (Backend code)
└── Index.html   (Frontend UI)
```

---

## Need Help?

The app is fully functional. If you want any changes:
- Different room numbers
- Additional fields
- Custom reports

Just ask!
