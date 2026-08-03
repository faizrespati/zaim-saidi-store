export type ProductType = "book" | "bundle";

export interface Book {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  categories: string[];
  language: string;
  productType: ProductType;
  image: string;
  synopsis: string;
  price: number | null;
  publisher: string | null;
  publicationYear: number | null;
  isbn: string | null;
  edition: string | null;
  pageCount: number | null;
  buyUrl: string;
  bundleItems?: string[];
}

export interface BookCatalog {
  version: string;
  store: {
    name: string;
    url: string;
  };
  currency: "IDR";
  books: Book[];
}
