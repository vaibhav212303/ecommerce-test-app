"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  totalPrice: number;
  clearCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);

  React.useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart");
  };

  const addItem = (item: CartItem) => {
    setItems((prev) => [...prev, item]);
    localStorage.setItem(
      "cart",
      JSON.stringify([...items, item])
    );
  };

  const removeItem = (id: string) => {
    const filtered = items.filter((item) => item.id !== id);
    setItems(filtered);
    localStorage.setItem("cart", JSON.stringify(filtered));
  };

  return (
    <CartContext.Provider value={{ items, totalPrice, clearCart, addItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
