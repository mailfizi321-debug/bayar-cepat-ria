-- Add tables to realtime publication for real-time updates
ALTER publication supabase_realtime ADD TABLE public.products;
ALTER publication supabase_realtime ADD TABLE public.receipts;
ALTER publication supabase_realtime ADD TABLE public.receipt_items;
ALTER publication supabase_realtime ADD TABLE public.profiles;