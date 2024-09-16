// src/store/productStore.ts
import { Product } from "@/lib/kiertonet/schemas";
import { create } from "zustand";

interface ProductState {
  products: Product[];
  columns: Array<{ name: string; type: string }>;
  isDynamic: boolean;
  setProducts: (products: Product[]) => void;
  setColumns: (columns: Array<{ name: string; type: string }>) => void;
  setIsDynamic: (isDynamic: boolean) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  file: null,
  columns: [],
  isDynamic: false,
  setColumns: (columns) => set({ columns }),
  setProducts: (products) =>
    set({
      products: products.map((p, index) => ({
        ...p,
        id: `${index}-${p.title}`,
      })),
    }),
  setIsDynamic: (isDynamic) => set({ isDynamic }),
}));
