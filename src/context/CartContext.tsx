"use client";

import React, { createContext, ReactNode, useContext } from "react";
import { CartItem, Product } from "@/types";

interface CartContextType {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
  clearCart: () => void;
  addItem: (item: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function normalizeCartItems(items: CartItem[]): CartItem[] {
  return Array.from(
    items
      .filter((item) => item.id && item.quantity > 0)
      .reduce((cart, item) => {
        const existing = cart.get(item.id);

        cart.set(item.id, {
          ...item,
          quantity: (existing?.quantity ?? 0) + item.quantity,
        });

        return cart;
      }, new Map<string, CartItem>())
      .values(),
  );
}

function saveCart(items: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);

  React.useEffect(() => {
    const savedCart = localStorage.getItem("cart");

    if (!savedCart) {
      return;
    }

    try {
      const parsedItems = JSON.parse(savedCart) as CartItem[];
      const normalizedItems = normalizeCartItems(parsedItems);

      setItems(normalizedItems);
      saveCart(normalizedItems);
    } catch {
      localStorage.removeItem("cart");
    }
  }, []);

  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart");
  };

  const addItem = (item: Product) => {
    setItems((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id);
      const nextItems = existingItem
        ? prev.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem,
          )
        : [...prev, { ...item, quantity: 1 }];

      saveCart(nextItems);
      return nextItems;
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const nextItems = prev.filter((item) => item.id !== id);
      saveCart(nextItems);
      return nextItems;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) => {
      const nextItems = prev
        .map((item) => (item.id === id ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0);

      saveCart(nextItems);
      return nextItems;
    });
  };

  return (
    <CartContext.Provider
      value={{
        items,
        totalPrice,
        totalItems,
        clearCart,
        addItem,
        removeItem,
        updateQuantity,
      }}
    >
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
