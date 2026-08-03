// admin/src/App.jsx

import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("semua");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/orders');
        const result = await response.json();
        if (result.success) {
          setOrders(result.data);
        }
      } catch (error) {
        console.error('Gagal memuat pesanan:', error);
      } finally {
        setLoading(false);
      }
    };

    // 1. Ambil data pertama kali saat halaman dibuka
    fetchOrders();

    // 2. Set Auto-Update: Ambil data otomatis setiap 5 detik (5000 ms)
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 5000);

    // 3. Bersihkan interval saat halaman ditutup (membersihkan memori)
    return () => clearInterval(intervalId);
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await response.json();
      if (result.success) {
        // Refresh instan setelah status diubah
        const res = await fetch('http://localhost:5000/api/orders');
        const data = await res.json();
        if (data.success) setOrders(data.data);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Gagal mengupdate status:', error);
    }
  };

  const filteredOrders = filterStatus === "semua"
    ? orders
    : orders.filter(o => o.status === filterStatus);

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#24211D] font-sans p-6 md:p-10">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-300 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Admin</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Zaim Saidi Store — Panel Kelola Pesanan (Auto-Sync)</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] font-medium bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync (Aktif)
            </span>
            <span className="text-xs font-semibold bg-[#315C4C] text-white px-3 py-1.5 rounded-md">
              Total Pesanan: {orders.length}
            </span>
          </div>
        </header>

        {/* FILTER STATUS */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["semua", "tertunda", "menunggu_pembayaran", "dibayar", "dibatalkan"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider transition cursor-pointer ${filterStatus === status
                ? 'bg-[#315C4C] text-white shadow-sm'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* TABEL PESANAN */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-500 text-sm">Memuat data pesanan dari database...</div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F3EA] border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-600">
                    <th className="p-4">ID</th>
                    <th className="p-4">Pemesan & Alamat</th>
                    <th className="p-4">Daftar Buku</th>
                    <th className="p-4">Total Harga</th>
                    <th className="p-4">Status Pesanan</th>
                    <th className="p-4">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {filteredOrders.map((order) => {
                    let parsedItems;
                    try {
                      parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                    } catch {
                      parsedItems = [];
                    }

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 font-mono font-bold text-[#315C4C]">#{order.id}</td>
                        <td className="p-4">
                          <p className="font-bold text-sm text-[#24211D]">{order.customer_name}</p>
                          <p className="text-gray-500 text-[11px] max-w-xs mt-0.5">{order.customer_address}</p>
                          {order.customer_note && (
                            <p className="text-amber-700 text-[11px] italic mt-1">Catatan: "{order.customer_note}"</p>
                          )}
                        </td>
                        <td className="p-4">
                          <ul className="space-y-1">
                            {parsedItems.map((item, idx) => (
                              <li key={idx} className="text-gray-700">
                                <span className="font-semibold">{item.title}</span> <span className="text-gray-500">({item.quantity}x)</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 font-bold text-[#24211D]">
                          Rp {order.total_price.toLocaleString('id-ID')}
                        </td>
                        <td className="p-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-md font-semibold text-xs border cursor-pointer focus:outline-none ${order.status === 'dibayar' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                              order.status === 'tertunda' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                                order.status === 'dibatalkan' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                                  'bg-blue-50 text-blue-700 border-blue-300'
                              }`}
                          >
                            <option value="tertunda">Tertunda</option>
                            <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
                            <option value="dibayar">Dibayar (Sukses)</option>
                            <option value="dibatalkan">Dibatalkan</option>
                          </select>
                        </td>
                        <td className="p-4 text-gray-400 text-[11px]">
                          {new Date(order.created_at).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 text-sm">
              Belum ada data pesanan masuk. Coba lakukan *checkout* dari halaman toko depan!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}