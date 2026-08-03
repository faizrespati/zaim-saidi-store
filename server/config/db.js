// server/config/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Konfigurasi SSL yang aman untuk TiDB Cloud di Vercel
let sslConfig = { rejectUnauthorized: true };

try {
  // Cek apakah file sertifikat root TiDB ada di folder proyek
  const caPath = path.resolve('certs/isrgrootx1.pem');
  if (fs.existsSync(caPath)) {
    sslConfig = {
      ca: fs.readFileSync(caPath),
      rejectUnauthorized: true
    };
  }
} catch (error) {
  console.log('Menggunakan SSL default TiDB Cloud');
}

// Membuat kolam koneksi (Connection Pool)
const dbPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Catatan: Tes koneksi dihapus dari tingkat atas (top-level) 
// agar tidak membuat Vercel Serverless Function crash saat cold start.
// Tes koneksi sudah ditangani langsung di rute /api/test-db.

export default dbPool;