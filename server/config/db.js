// config/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Membuat kolam koneksi (Connection Pool)
const dbPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Tes koneksi saat file ini dipanggil
dbPool.getConnection()
  .then(() => console.log('✅ Database MySQL berhasil terhubung!'))
  .catch((err) => console.error('❌ Gagal terhubung ke database:', err.message));

export default dbPool;