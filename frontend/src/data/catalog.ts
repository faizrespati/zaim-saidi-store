import catalogData from "../data/books.json";
import type { BookCatalog } from "../types/book";

export const catalog = catalogData as BookCatalog;
export const books = catalog.books;

export function getBookBySlug(slug: string) {
  return books.find((book) => book.slug === slug);
}

export function formatBookPrice(price: number | null) {
  if (price === null) return "Harga belum tersedia";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: catalog.currency,
    maximumFractionDigits: 0,
  }).format(price);
}
