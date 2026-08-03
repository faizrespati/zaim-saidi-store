// server/controllers/orderController.js

import dbPool from '../config/db.js';

export const createOrder = async (req, res) => {
  const connection = await dbPool.getConnection();
  try {
    const { name, address, note, items, total } = req.body;

    if (!name || !address || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Data pesanan tidak lengkap.' });
    }

    // Mulai transaksi database (jika ada error, data dibatalkan semua)
    await connection.beginTransaction();

    // 1. Masukkan ke tabel orders
    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_name, customer_address, customer_note, total_price, status) VALUES (?, ?, ?, ?, ?)',
      [name, address, note || null, total, 'tertunda']
    );

    const orderId = orderResult.insertId;

    // 2. Masukkan item-item buku ke tabel order_items
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, book_id, quantity, price_at_checkout) VALUES (?, ?, ?, ?)',
        [orderId, item.id, item.qty, item.price]
      );
    }

    await connection.commit();
    connection.release();

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dicatat di database!',
      orderId: orderId
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses pesanan di server', error: error.message });
  }
};

// Fungsi untuk mengambil semua pesanan untuk Dashboard Admin
export const getAllOrders = async (req, res) => {
  try {
    const query = `
            SELECT 
                o.*,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'book_id', oi.book_id,
                        'quantity', oi.quantity,
                        'price', oi.price_at_checkout,
                        'title', b.title
                    )
                ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN books b ON oi.book_id = b.id
            GROUP BY o.id
            ORDER BY o.created_at DESC;
        `;

    const [orders] = await dbPool.query(query);

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil daftar pesanan',
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pesanan', error: error.message });
  }
};

// Fungsi untuk mengupdate status pesanan
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await dbPool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    res.status(200).json({
      success: true,
      message: `Status pesanan #${id} berhasil diubah menjadi ${status}`
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Gagal mengupdate status pesanan', error: error.message });
  }
};