-- Enable real-time for all POS tables
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.receipts REPLICA IDENTITY FULL;
ALTER TABLE public.receipt_items REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;