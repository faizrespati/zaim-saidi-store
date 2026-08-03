// server/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os'; // Modul bawaan Node.js untuk mendeteksi jaringan
import dbPool from './config/db.js';

import bookRoutes from './routes/bookRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Rute Pengecekan Dasar
app.get('/', (req, res) => {
  res.send('Server Toko Buku berjalan dengan baik! 🚀');
});

app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT 1 + 1 AS solution');
    res.json({ status: 'sukses', solution: rows[0].solution });
  } catch (error) {
    res.status(500).json({ status: 'gagal', error: error.message });
  }
});

// --- DAFTARKAN ROUTES ---
app.use('/api/books', bookRoutes);
app.use('/api/orders', orderRoutes);

// Fungsi pembantu untuk mendeteksi IPv4 lokal secara otomatis (gaya Vite)
const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Cari IPv4 yang bukan alamat internal (localhost)
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
};

// HANYA jalankan app.listen jika sedang di komputer lokal (bukan di Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    const localIp = getLocalIpAddress();
    console.log(`--------------------------------------------------`);
    console.log(`  🚀 Server Backend Toko Buku Berhasil Menyala!`);
    console.log(`  - Local:   http://localhost:${PORT}`);
    console.log(`  - Network: http://${localIp}:${PORT}`);
    console.log(`--------------------------------------------------`);
  });
}

// ⚠️ INI YANG KURANG DAN WAJIB ADA AGAR VERCEL TIDAK CRASH:
export default app;