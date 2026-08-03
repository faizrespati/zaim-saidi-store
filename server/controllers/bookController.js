// server/controllers/bookController.js

import dbPool from '../config/db.js';

// Fungsi untuk mengambil semua buku dari database
export const getAllBooks = async (req, res) => {
  try {
    // Bertanya ke database MySQL: "Tolong ambilkan semua isi tabel books"
    const [books] = await dbPool.query('SELECT * FROM books');

    // Kirim jawabannya ke frontend dalam bentuk JSON
    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil daftar buku',
      data: books
    });
  } catch (error) {
    console.error('Error get books:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal pada server',
      error: error.message
    });
  }
};