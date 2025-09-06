import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Receipt as ReceiptIcon, CreditCard, Percent, Copy } from 'lucide-react';
import { Receipt as ReceiptType, Product } from '@/types/pos';
import { toast } from 'sonner';
// Generate proper UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface ManualItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  total: number;
  isPhotocopy?: boolean;
}

interface ManualInvoiceProps {
  onCreateInvoice: (receipt: ReceiptType) => void;
  formatPrice: (price: number) => string;
  receipts: ReceiptType[];
  products: Product[];
  processManualTransaction?: (cart: any[], paymentMethod?: string, discount?: number) => Promise<ReceiptType | null>;
}

export const ManualInvoice = ({ onCreateInvoice, formatPrice, receipts, products, processManualTransaction }: ManualInvoiceProps) => {
  const [items, setItems] = useState<ManualItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    name: '',
    quantity: 0,
    unitPrice: 0,
    isPhotocopy: false
  });
  const [paymentMethod, setPaymentMethod] = useState('tunai');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');

  const photocopyProducts = products.filter(p => p.isPhotocopy);

  const addItem = () => {
    if (!currentItem.name.trim()) {
      toast.error('Nama barang harus diisi!');
      return;
    }

    if (currentItem.isPhotocopy) {
      // Untuk fotocopy, validasi harga total
      if (currentItem.unitPrice <= 0) {
        toast.error('Total harga fotocopy harus diisi!');
        return;
      }
      
      const newItem: ManualItem = {
        id: generateUUID(),
        name: currentItem.name,
        quantity: 1, // Fotocopy selalu quantity 1
        unitPrice: currentItem.unitPrice,
        total: currentItem.unitPrice,
        isPhotocopy: true
      };
      
      setItems(prev => [...prev, newItem]);
    } else {
      // Untuk barang regular, validasi jumlah dan harga satuan
      if (currentItem.quantity <= 0) {
        toast.error('Jumlah barang harus diisi!');
        return;
      }
      
      if (currentItem.unitPrice <= 0) {
        toast.error('Harga satuan harus diisi!');
        return;
      }

      const newItem: ManualItem = {
        id: generateUUID(),
        name: currentItem.name,
        quantity: currentItem.quantity,
        unitPrice: currentItem.unitPrice,
        total: currentItem.quantity * currentItem.unitPrice,
        isPhotocopy: false
      };

      setItems(prev => [...prev, newItem]);
    }

    // Reset form
    setCurrentItem({ name: '', quantity: 0, unitPrice: 0, isPhotocopy: false });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return;
    setItems(prev => prev.map(item => 
      item.id === id && !item.isPhotocopy
        ? { ...item, quantity, total: quantity * (item.unitPrice || 0) }
        : item
    ));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = discountType === 'percent' 
    ? Math.round(subtotal * (discount / 100))
    : discount;
  const total = Math.max(0, subtotal - discountAmount);

  const handleCreateInvoice = async () => {
    if (items.length === 0) {
      toast.error('Tambahkan minimal satu item!');
      return;
    }

    try {
      // Convert manual items to cart items format with proper product structure
      const cartItems = items.map(item => ({
        product: {
          id: generateUUID(), // Generate new UUID for manual products
          name: item.name,
          costPrice: item.isPhotocopy ? item.total : 0, // For photocopy, set cost = total (no profit)
          sellPrice: item.unitPrice || 0,
          stock: 0,
          category: item.isPhotocopy ? 'Fotocopy' : 'Manual',
          isPhotocopy: item.isPhotocopy || false
        },
        quantity: item.quantity,
        finalPrice: item.unitPrice
      }));

      let receipt: ReceiptType | null = null;

      if (processManualTransaction) {
        // Use database transaction
        receipt = await processManualTransaction(cartItems, paymentMethod, discountAmount);
      } else {
        // Fallback to local processing
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const dateStr = `${day}${month}${year}`;
        const counter = receipts.length + 1;
        const invoiceId = `MAN-${dateStr}-${String(counter).padStart(4, '0')}`;

        // Calculate profit: only non-photocopy items contribute to profit
        const calculatedProfit = cartItems.reduce((sum, item) => {
          if (item.product.isPhotocopy) return sum; // Photocopy items don't contribute to profit in manual invoices
          return sum + ((item.finalPrice || item.product.sellPrice) - item.product.costPrice) * item.quantity;
        }, 0);

        receipt = {
          id: invoiceId,
          items: cartItems,
          subtotal,
          discount: discountAmount,
          total,
          profit: calculatedProfit,
          timestamp: new Date(),
          paymentMethod
        };
      }

      if (receipt) {
        onCreateInvoice(receipt);
        
        // Reset form
        setItems([]);
        setCurrentItem({ name: '', quantity: 0, unitPrice: 0, isPhotocopy: false });
        setDiscount(0);
        setPaymentMethod('tunai');
        
        toast.success('Nota manual berhasil dibuat!');
      } else {
        toast.error('Gagal memproses transaksi manual');
      }
      
      return receipt;
    } catch (error) {
      console.error('Error creating manual invoice:', error);
      toast.error('Gagal membuat nota manual');
      return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Add Item Form */}
      <div className="lg:col-span-2">
        <Card className="pos-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5" />
              Nota Manual - Input Barang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={currentItem.isPhotocopy}
                    onChange={(e) => setCurrentItem(prev => ({ 
                      ...prev, 
                      isPhotocopy: e.target.checked,
                      name: e.target.checked ? 'Fotocopy' : '',
                      unitPrice: 0,
                      quantity: e.target.checked ? 1 : 0
                    }))}
                    className="rounded"
                  />
                  <Copy className="h-4 w-4" />
                  Fotocopy (input harga total langsung)
                </label>
              </div>
              
              {currentItem.isPhotocopy ? (
                // Fotocopy input - hanya nama dan total harga
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="itemName">Nama Item</Label>
                    <Input
                      id="itemName"
                      placeholder="Fotocopy"
                      value={currentItem.name}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, name: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalPrice">Total Harga Fotocopy</Label>
                    <Input
                      id="totalPrice"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={currentItem.unitPrice || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, unitPrice: Number(e.target.value) || 0 }))}
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    />
                  </div>
                </div>
              ) : (
                // Regular item input - nama, jumlah, harga satuan
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="itemName">Nama Barang/Jasa</Label>
                    <Input
                      id="itemName"
                      placeholder="Masukkan nama barang atau jasa"
                      value={currentItem.name}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, name: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Jumlah</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={currentItem.quantity || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: Number(e.target.value) || 0 }))}
                      placeholder="Jumlah"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unitPrice">Harga Satuan</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={currentItem.unitPrice || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, unitPrice: Number(e.target.value) || 0 }))}
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Total: {currentItem.isPhotocopy ? 
                    formatPrice(currentItem.unitPrice || 0) : 
                    formatPrice(currentItem.quantity * currentItem.unitPrice)
                  }
                </div>
                <Button onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Item
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items List */}
        {items.length > 0 && (
          <Card className="pos-card mt-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Daftar Item</span>
                <Badge variant="secondary">{items.length} item</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {item.name}
                        {item.isPhotocopy && <Badge variant="secondary" className="text-xs">Fotocopy</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.isPhotocopy ? (
                          `Total: ${formatPrice(item.total)}`
                        ) : (
                          `${item.quantity} x ${formatPrice(item.unitPrice || 0)} = ${formatPrice(item.total)}`
                        )}
                      </div>
                    </div>
                    {!item.isPhotocopy && (
                      <div className="flex items-center gap-2 mx-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary & Actions */}
      <div>
        <Card className="pos-card">
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              
              {/* Discount */}
              <div className="space-y-2">
                <Label>Diskon</Label>
                <div className="flex gap-2">
                  <Select value={discountType} onValueChange={(value: 'amount' | 'percent') => setDiscountType(value)}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount">Rp</SelectItem>
                      <SelectItem value="percent">%</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    max={discountType === 'percent' ? 100 : subtotal}
                    value={discount || ''}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Diskon: {formatPrice(discountAmount)}
                </div>
              </div>

              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tunai">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Tunai
                    </div>
                  </SelectItem>
                  <SelectItem value="transfer">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Transfer
                    </div>
                  </SelectItem>
                  <SelectItem value="qris">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      QRIS
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={handleCreateInvoice} 
                className="w-full"
                disabled={items.length === 0}
              >
                <ReceiptIcon className="h-4 w-4 mr-2" />
                Buat Nota Manual
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};