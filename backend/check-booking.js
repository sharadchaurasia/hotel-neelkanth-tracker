const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://hotel_admin:JBrr85MttexyXBg15tdDfQUz@localhost:5432/hotel_neelkanth'
});

async function checkBooking() {
  try {
    await client.connect();
    console.log('Connected to database');

    // First, list all tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('\nTables in database:');
    tables.rows.forEach(t => console.log('  -', t.table_name));

    // Check if bookings table exists
    const bookingsTable = tables.rows.find(t => t.table_name === 'bookings');
    if (!bookingsTable) {
      console.log('\nERROR: bookings table not found!');
      return;
    }

    // Count bookings
    const count = await client.query(`SELECT COUNT(*) FROM bookings`);
    console.log('\nTotal bookings:', count.rows[0].count);

    const result = await client.query(`
      SELECT booking_id, guest_name, payment_type, payment_mode,
             total_amount, collection_amount, hotel_share, created_at
      FROM bookings
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('\nRecent bookings:');
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log('---');
        console.log('Booking ID:', row.booking_id);
        console.log('Guest:', row.guest_name);
        console.log('Payment Type:', row.payment_type);
        console.log('Payment Mode:', row.payment_mode);
        console.log('Total Amount:', row.total_amount);
        console.log('Collection Amount:', row.collection_amount);
        console.log('Hotel Share:', row.hotel_share);
      });
    } else {
      console.log('No bookings found');
    }
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await client.end();
  }
}

checkBooking();
