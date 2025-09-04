import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="group hover:shadow-medium transition-all duration-200 cursor-pointer">
          <CardContent className="p-4">
            <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center text-muted-foreground text-sm font-medium">
              {product.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
                <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
                  {product.category}
                </Badge>
              </div>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(product.price)}
              </p>
              <Button
                onClick={() => onAddToCart(product)}
                className="w-full group-hover:bg-primary-hover transition-colors"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}