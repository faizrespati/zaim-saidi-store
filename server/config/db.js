// server/config/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Membuat kolam koneksi (Connection Pool) dengan konfigurasi TiDB Cloud
const dbPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 4000, // Port TiDB Cloud biasanya 4000
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true // Wajib agar bisa terhubung secara aman ke TiDB Cloud
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Tes koneksi saat file ini dipanggil
dbPool.getConnection()
  .then((connection) => {
    console.log('✅ Database MySQL (TiDB Cloud) berhasil terhubung!');
    connection.release();
  })
  .catch((err) => console.error('❌ Gagal terhubung ke database:', err.message));

export default dbPool;