// server/seed.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dbPool from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'data', 'books.json');

const seedDatabase = async () => {
  try {
    console.log('🌱 Memulai proses migrasi data buku ke MySQL...');

    if (!fs.existsSync(filePath)) {
      console.error(`❌ File books.json tidak ditemukan di: ${filePath}`);
      process.exit(1);
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const catalog = JSON.parse(rawData);
    const books = catalog.books;

    console.log(`📚 Menemukan ${books.length} buku di dalam file JSON. Memproses penyimpanan...`);

    for (const book of books) {
      // 1. Simpan data utama ke tabel books
      const bookQuery = `
                INSERT INTO books (id, slug, title, subtitle, synopsis, price, image_url, publisher, publication_year, isbn, page_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                title=VALUES(title), synopsis=VALUES(synopsis), price=VALUES(price), image_url=VALUES(image_url);
            `;
      await dbPool.query(bookQuery, [
        book.id,
        book.slug,
        book.title,
        book.subtitle || null,
        book.synopsis || null,
        book.price !== undefined ? book.price : null,
        book.image || null,
        book.publisher || null,
        book.publicationYear || null,
        book.isbn || null,
        book.pageCount || null
      ]);

      // 2. Proses Penulis (Authors)
      if (book.authors && book.authors.length > 0) {
        for (const authorName of book.authors) {
          await dbPool.query('INSERT IGNORE INTO authors (name) VALUES (?)', [authorName]);
          const [authorRows] = await dbPool.query('SELECT id FROM authors WHERE name = ?', [authorName]);
          const authorId = authorRows[0].id;

          await dbPool.query(
            'INSERT IGNORE INTO book_authors (book_id, author_id) VALUES (?, ?)',
            [book.id, authorId]
          );
        }
      }

      // 3. Proses Kategori (Categories)
      if (book.categories && book.categories.length > 0) {
        for (const catName of book.categories) {
          await dbPool.query('INSERT IGNORE INTO categories (name) VALUES (?)', [catName]);
          const [catRows] = await dbPool.query('SELECT id FROM categories WHERE name = ?', [catName]);
          const catId = catRows[0].id;

          await dbPool.query(
            'INSERT IGNORE INTO book_categories (book_id, category_id) VALUES (?, ?)',
            [book.id, catId]
          );
        }
      }
    }

    console.log('✨ MIGRASI BERHASIL! Seluruh buku, penulis, dan kategori telah masuk ke MySQL.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Gagal melakukan migrasi database:', error);
    process.exit(1);
  }
};

seedDatabase();