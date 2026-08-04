// frontend/src/App.jsx

import { useState, useEffect } from 'react';

export default function Homepage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('local_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);

  // State untuk Panel Keranjang & Transisinya
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);
  const [isToastVisible, setIsToastVisible] = useState(false);

  const [selectedBook, setSelectedBook] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerNote, setBuyerNote] = useState("");

  const booksPerPage = 6;

  // AMBIL DATA DARI BACKEND EXPRESS KITA SAAT HALAMAN DIBUKA
  useEffect(() => {
    fetch('https://zaim-saidi-store.vercel.app/api/books')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setBooks(result.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Gagal mengambil data dari server:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem('local_cart', JSON.stringify(cart));
  }, [cart]);

  // Mengambil kategori unik otomatis dari data database
  const UNIQUE_CATEGORIES = ["Semua", ...new Set(books.flatMap(book => book.categories || []))];

  const handleOpenCart = () => {
    setIsCartOpen(true);
    setTimeout(() => setIsCartVisible(true), 10);
  };

  const handleCloseCart = () => {
    setIsCartVisible(false);
    setTimeout(() => setIsCartOpen(false), 300);
  };

  const handleOpenModal = (book) => {
    setSelectedBook(book);
    setTimeout(() => setIsModalVisible(true), 10);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setTimeout(() => setSelectedBook(null), 300);
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (selectedBook) handleCloseModal();
        if (isCartOpen) handleCloseCart();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedBook, isCartOpen]);

  const handleAddToCart = (book) => {
    if (book.price === null) {
      alert("Maaf, buku ini belum tersedia harganya.");
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === book.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === book.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...book, qty: 1 }];
    });

    setToastMessage(`"${book.title}" ditaruh di keranjang.`);
    setIsToastVisible(true);

    setTimeout(() => setIsToastVisible(false), 2500);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const handleUpdateQty = (id, delta) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Filter pencarian dan kategori berdasarkan data dari database
  const filteredBooks = books.filter((book) => {
    const titleMatch = book.title ? book.title.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const authorMatch = book.authors ? book.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) : false;
    const matchesSearch = titleMatch || authorMatch;

    const matchesCategory = selectedCategory === "Semua" || (book.categories && book.categories.includes(selectedCategory));
    return matchesSearch && matchesCategory;
  });

  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCheckoutWhatsApp = async (e) => {
    e.preventDefault();
    if (!buyerName || !buyerAddress) {
      alert("Mohon isi Nama dan Alamat pengiriman terlebih dahulu.");
      return;
    }

    if (cart.length === 0) {
      alert("Keranjang belanja masih kosong.");
      return;
    }

    // 1. Siapkan payload data untuk dikirim ke Backend API
    const orderPayload = {
      name: buyerName,
      address: buyerAddress,
      note: buyerNote,
      items: cart,
      total: totalPrice
    };

    try {
      // 2. Kirim data pesanan ke backend Express
      const response = await fetch('https://zaim-saidi-store.vercel.app/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan pesanan.');
      }

      // 3. Jika sukses tersimpan di database, susun pesan WhatsApp
      let message = `Halo Admin, saya ingin memesan buku:\n\n`;
      cart.forEach((item, index) => {
        message += `${index + 1}. *${item.title}* (${item.qty}x) - Rp ${(item.price * item.qty).toLocaleString('id-ID')}\n`;
      });
      message += `\n*Subtotal Produk:* Rp ${totalPrice.toLocaleString('id-ID')}\n`;
      message += `*(Ongkir akan dikonfirmasi admin)*\n\n`;
      message += `*Data Pemesan:*\n`;
      message += `Nama: ${buyerName}\n`;
      message += `Alamat: ${buyerAddress}\n`;
      if (buyerNote) message += `Catatan: ${buyerNote}\n`;
      message += `\n*(No. Pesanan Sistem: #${result.orderId})*`;

      const encodedMessage = encodeURIComponent(message);
      const adminWhatsAppNumber = "62895396921984"; // Ganti dengan nomor WhatsApp tokoku

      // 4. Buka tab WhatsApp
      window.open(`https://wa.me/${adminWhatsAppNumber}?text=${encodedMessage}`, '_blank');

      // 5. Bersihkan keranjang dan form
      setCart([]);
      setBuyerName("");
      setBuyerAddress("");
      setBuyerNote("");
      setIsCartOpen(false);

    } catch (error) {
      console.error('Checkout error:', error);
      alert('Terjadi kesalahan saat memproses pesanan: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-[#24211D] font-sans flex flex-col justify-between relative">

      <div>
        {/* HEADER */}
        <header className="bg-[#FFFDF8] border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Zaim Saidi Store<span className="text-[#315C4C]">.</span>
            </h1>
            <p className="text-[11px] text-gray-500 tracking-wide uppercase">Kurasi Bacaan Independen</p>
          </div>

          <button
            onClick={handleOpenCart}
            className="flex items-center gap-2.5 bg-[#FFFDF8] px-4 py-2 rounded-md hover:bg-[#F7F3EA] transition font-medium text-sm relative cursor-pointer border border-gray-300/80 shadow-xs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#315C4C]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="text-xs uppercase tracking-wider font-semibold">Keranjang</span>
            {totalCartItems > 0 && (
              <span className="bg-[#315C4C] text-white px-2 py-0.5 rounded-full text-[11px] font-bold">
                {totalCartItems}
              </span>
            )}
          </button>
        </header>

        {/* HERO SECTION */}
        <section className="px-6 py-12 md:py-16 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
            Ruang baca, untuk semua.
          </h2>
          <p className="text-gray-600 text-sm md:text-base mb-8">
            Pilihan buku fisik berkualitas. Pesan mudah, konfirmasi pesanan cepat via WhatsApp.
          </p>

          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Cari judul buku atau penulis..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 rounded-lg bg-[#FFFDF8] border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#315C4C] text-sm shadow-xs"
            />
          </div>
        </section>

        {/* FILTER KATEGORI */}
        <div className="px-6 max-w-5xl mx-auto mb-10 flex flex-wrap gap-2 justify-center">
          {UNIQUE_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${selectedCategory === category
                ? 'bg-[#315C4C] text-white shadow-xs'
                : 'bg-[#FFFDF8] border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* KATALOG BUKU */}
        <main className="px-6 max-w-5xl mx-auto mb-16">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200/60 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600">Katalog Pilihan</h3>
            <span className="text-xs text-gray-500">
              {loading ? "Memuat data dari database..." : `Menampilkan ${filteredBooks.length} buku`}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-500 bg-[#FFFDF8] rounded-lg border border-gray-200 text-sm">
              Sedang mengambil data dari server database...
            </div>
          ) : currentBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentBooks.map((book) => (
                <div key={book.id} className="bg-[#FFFDF8] p-4 rounded-lg border border-gray-200/80 shadow-xs flex flex-col hover:border-gray-300 transition group">

                  <div
                    className="cursor-pointer"
                    onClick={() => handleOpenModal(book)}
                  >
                    <div className="relative w-full h-72 rounded-md mb-4 flex justify-center items-center overflow-hidden border border-gray-200/50 bg-[#EFECE6]">
                      {book.image_url ? (
                        <img
                          src={book.image_url}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300 ease-in-out"
                        />
                      ) : (
                        <span className="text-xs uppercase tracking-widest font-mono text-gray-400">No Image</span>
                      )}

                      {book.categories && book.categories.length > 0 && (
                        <span className="absolute top-2.5 left-2.5 bg-[#FFFDF8] text-[#315C4C] text-[10px] font-semibold px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                          {book.categories[0]}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-base leading-snug mb-1 text-[#24211D] group-hover:text-[#315C4C] transition line-clamp-2">{book.title}</h4>
                    <p className="text-xs text-gray-500 mb-6 truncate">{book.authors ? book.authors.join(', ') : ''}</p>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="font-bold text-sm text-[#24211D]">
                      {book.price ? `Rp ${book.price.toLocaleString('id-ID')}` : 'Harga Menyusul'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(book);
                      }}
                      disabled={book.price === null}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition shadow-xs ${book.price
                        ? 'bg-[#315C4C] text-white hover:bg-opacity-90 active:scale-95 cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      + Beli
                    </button>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500 bg-[#FFFDF8] rounded-lg border border-gray-200 text-sm">
              Tidak ada buku yang sesuai dengan pencarianmu.
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-12">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => {
                    setCurrentPage(index + 1);
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  className={`w-9 h-9 rounded-md text-xs font-semibold transition cursor-pointer ${currentPage === index + 1
                    ? 'bg-[#315C4C] text-white shadow-xs'
                    : 'bg-[#FFFDF8] border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-gray-200 bg-[#FFFDF8] py-6 px-6 text-center text-xs text-gray-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="font-medium text-[#24211D]">Zaim Saidi Store — Kurasi Bacaan Pilihan</p>
          <p>Pemesanan langsung diproses melalui WhatsApp admin.</p>
        </div>
      </footer>

      {/* --- MODAL DETAIL BUKU --- */}
      {selectedBook && (
        <div
          className={`fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-sm transition-all duration-300 ease-in-out ${isModalVisible ? 'bg-black/50 opacity-100' : 'bg-transparent opacity-0'
            }`}
          onClick={handleCloseModal}
        >
          <div
            className={`bg-[#FFFDF8] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl flex flex-col md:flex-row border border-gray-200 transition-all duration-300 ease-in-out transform ${isModalVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:w-5/12 bg-[#EFECE6] min-h-[300px] md:min-h-full flex flex-col justify-center items-center border-r border-gray-200 overflow-hidden relative">
              {selectedBook.image_url ? (
                <img src={selectedBook.image_url} alt={selectedBook.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm uppercase tracking-widest font-mono text-gray-400">No Image</span>
              )}
            </div>

            <div className="md:w-7/12 p-6 md:p-8 flex flex-col relative">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold text-lg cursor-pointer bg-gray-100 rounded-md w-8 h-8 flex items-center justify-center transition-colors"
              >
                ✕
              </button>

              <span className="text-xs font-semibold text-[#315C4C] uppercase tracking-wider mb-2">
                {selectedBook.categories ? selectedBook.categories.join(', ') : 'Umum'}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#24211D] mb-1 leading-tight">{selectedBook.title}</h2>
              {selectedBook.subtitle && <p className="text-sm italic text-gray-600 mb-2">{selectedBook.subtitle}</p>}
              <p className="text-sm text-gray-500 mb-6 font-medium">oleh {selectedBook.authors ? selectedBook.authors.join(', ') : ''}</p>

              <div className="mb-6 pb-6 border-b border-gray-200">
                <span className="text-2xl font-bold text-[#24211D]">
                  {selectedBook.price ? `Rp ${selectedBook.price.toLocaleString('id-ID')}` : 'Harga Menyusul'}
                </span>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Sinopsis</h4>
                <p className="text-sm text-gray-700 leading-relaxed text-justify">
                  {selectedBook.synopsis || "Sinopsis belum tersedia."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 bg-[#F7F3EA] p-4 rounded-md border border-gray-200/60">
                <div>
                  <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-0.5">Penerbit</p>
                  <p className="text-sm font-semibold text-[#24211D]">{selectedBook.publisher || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-0.5">Halaman</p>
                  <p className="text-sm font-semibold text-[#24211D]">{selectedBook.page_count || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-0.5">Tahun</p>
                  <p className="text-sm font-semibold text-[#24211D]">{selectedBook.publication_year || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-0.5">ISBN</p>
                  <p className="text-sm font-semibold text-[#24211D]">{selectedBook.isbn || "-"}</p>
                </div>
              </div>

              <div className="mt-auto">
                <button
                  disabled={selectedBook.price === null}
                  onClick={() => {
                    handleAddToCart(selectedBook);
                    handleCloseModal();
                  }}
                  className={`w-full py-3 rounded-md font-medium text-sm transition shadow-xs ${selectedBook.price
                    ? 'bg-[#315C4C] text-white hover:bg-opacity-90 active:scale-95 cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  {selectedBook.price ? 'Tambah ke Keranjang' : 'Belum Bisa Dibeli'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#24211D] text-[#FFFDF8] px-4 py-2.5 rounded-lg shadow-md text-xs font-medium flex items-center gap-2 transition-opacity duration-300 ease-in-out ${isToastVisible ? 'opacity-100' : 'opacity-0'}`}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* --- PANEL KERANJANG --- */}
      {isCartOpen && (
        <div
          className={`fixed inset-0 z-50 flex justify-end transition-colors duration-300 ${isCartVisible ? 'bg-black/40 backdrop-blur-[2px]' : 'bg-transparent'
            }`}
          onClick={handleCloseCart}
        >
          <div
            className={`w-full max-w-md bg-[#FFFDF8] h-full shadow-2xl flex flex-col p-6 overflow-y-auto transition-transform duration-300 ease-out transform ${isCartVisible ? 'translate-x-0' : 'translate-x-full'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h3 className="text-base font-bold">Keranjang Belanja</h3>
              <button onClick={handleCloseCart} className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer">✕</button>
            </div>

            {cart.length > 0 ? (
              <div className="flex-1 flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-2.5 overflow-y-auto max-h-60 pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-[#F7F3EA] p-3 rounded-md border border-gray-200/60">
                      <div>
                        <h5 className="font-bold text-xs line-clamp-1">{item.title}</h5>
                        <p className="text-[11px] text-gray-600">Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <button onClick={() => handleUpdateQty(item.id, -1)} className="bg-white w-6 h-6 rounded border text-xs font-bold shadow-xs cursor-pointer">-</button>
                        <span className="text-xs font-semibold w-3 text-center">{item.qty}</span>
                        <button onClick={() => handleUpdateQty(item.id, 1)} className="bg-white w-6 h-6 rounded border text-xs font-bold shadow-xs cursor-pointer">+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 flex justify-between items-center font-bold text-sm">
                  <span>Subtotal Produk:</span>
                  <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>

                <form onSubmit={handleCheckoutWhatsApp} className="mt-1 flex flex-col gap-3 border-t pt-4">
                  <h4 className="font-bold text-xs text-[#315C4C] uppercase tracking-wide">Informasi Pengiriman</h4>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">Nama Lengkap *</label>
                    <input type="text" required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="w-full px-3 py-2 rounded-md border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#315C4C]" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">Alamat Lengkap Pengiriman *</label>
                    <textarea required rows="2" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} className="w-full px-3 py-2 rounded-md border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#315C4C]" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">Catatan Tambahan (Opsional)</label>
                    <input type="text" value={buyerNote} onChange={(e) => setBuyerNote(e.target.value)} className="w-full px-3 py-2 rounded-md border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#315C4C]" />
                  </div>
                  <p className="text-[10px] text-gray-500 italic mt-0.5">* Ongkir dan total akhir akan dikonfirmasi admin melalui WhatsApp.</p>
                  <button type="submit" className="mt-2 w-full bg-[#315C4C] text-white py-2.5 rounded-md font-medium text-xs hover:bg-opacity-90 transition shadow-xs active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                    <span>💬</span> Pesan & Buka WhatsApp
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center py-8">
                <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"></path>
                </svg>
                <p className="text-xs">Keranjang belanjaanmu masih kosong.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}