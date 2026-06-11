const mysql = require('mysql2/promise');
const fs = require('fs');

async function extract() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kimorori'
  });

  // Check what tables exist
  const [tables] = await connection.execute('SHOW TABLES');
  console.log('Tables:', tables.map(t => Object.values(t)[0]).filter(t => t.includes('school') || t.includes('image')));

  // Check school table
  try {
    const [schoolRows] = await connection.execute('SELECT * FROM school LIMIT 1');
    console.log('School table data:', schoolRows);
  } catch (e) {
    console.log('Error reading school table', e.message);
  }

  // Check images table
  try {
    const [imagesRows] = await connection.execute('SELECT * FROM images LIMIT 1');
    if (imagesRows.length > 0) {
      console.log('Images columns:', Object.keys(imagesRows[0]));
      let imageField = null;
      for (const key of Object.keys(imagesRows[0])) {
        if (Buffer.isBuffer(imagesRows[0][key])) {
          imageField = key;
          break;
        }
      }
      if (imageField) {
        fs.writeFileSync('../frontend/public/logo.png', imagesRows[0][imageField]);
        console.log('Logo extracted to frontend/public/logo.png');
      } else {
        console.log('No BLOB found in images table');
      }
    } else {
      console.log('Images table is empty');
    }
  } catch (e) {
    console.log('Error reading images table', e.message);
  }

  await connection.end();
}

extract();
