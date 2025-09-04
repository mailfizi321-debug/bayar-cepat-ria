import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/ProductGrid";
import { CartPanel } from "@/components/CartPanel";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, DollarSign, Receipt, Package } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Kopi Americano",
    price: 25000,
    image: "/placeholder.svg",
    category: "Minuman"
  },
  {
    id: "2", 
    name: "Nasi Gudeg",
    price: 35000,
    image: "/placeholder.svg",
    category: "Makanan"
  },
  {
    id: "3",
    name: "Teh Manis",
    price: 15000,
    image: "/placeholder.svg",
    category: "Minuman"
  },
  {
    id: "4",
    name: "Ayam Bakar",
    price: 45000,
    image: "/placeholder.svg", 
    category: "Makanan"
  },
  {
    id: "5",
    name: "Es Teh",
    price: 12000,
    image: "/placeholder.svg",
    category: "Minuman"
  },
  {
    id: "6",
    name: "Sate Ayam",
    price: 40000,
    image: "/placeholder.svg",
    category: "Makanan"
  }
];

const Index = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== id));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Kasir POS</h1>
                <p className="text-sm text-muted-foreground">Sistem Point of Sale</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Card className="px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{SAMPLE_PRODUCTS.length} Produk</span>
                </div>
              </Card>
              <Card className="px-4 py-2">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{totalItems} Item</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Daftar Produk</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductGrid products={SAMPLE_PRODUCTS} onAddToCart={addToCart} />
              </CardContent>
            </Card>
          </div>

          {/* Cart Panel */}
          <div className="lg:col-span-1">
            <CartPanel
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onClearCart={clearCart}
              totalAmount={totalAmount}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;