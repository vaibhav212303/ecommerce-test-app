import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TESTRIG-E-SHOP | Modern E-commerce Store",
  description: "Shop the latest fashion and accessories with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex h-full flex-col bg-gray-50 antialiased`}>
        <CartProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <footer className="border-t bg-white py-8">
            <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
              &copy; {new Date().getFullYear()} TESTRIG-E-SHOP. All rights reserved.
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
