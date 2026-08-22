const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to database!');
    const res = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name;
    `);
    console.log('Tables found:');
    if (res.rows.length === 0) {
      console.log('No tables found in any schema.');
    } else {
      res.rows.forEach(row => {
        console.log(`- [${row.table_schema}] ${row.table_name}`);
      });
    }
  } catch (err) {
    console.error('Error connecting or querying:', err);
  } finally {
    await client.end();
  }
}

main();
