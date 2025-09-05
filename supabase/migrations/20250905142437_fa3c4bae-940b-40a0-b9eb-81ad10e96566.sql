-- Update invoice number format to INV-DDMMYY-XXXX
CREATE OR REPLACE FUNCTION public.generate_invoice_number_v2(is_manual boolean DEFAULT false)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invoice_number TEXT;
  counter INTEGER;
  prefix TEXT;
  date_format TEXT;
BEGIN
  -- Determine prefix based on transaction type
  IF is_manual THEN
    prefix := 'MAN-';
  ELSE
    prefix := 'INV-';
  END IF;
  
  -- Get current date in DDMMYY format (Indonesian format)
  date_format := to_char(now(), 'DDMMYY');
  invoice_number := prefix || date_format || '-';
  
  -- Get next counter for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH(prefix || date_format || '-') + 1) AS INTEGER)), 0) + 1
  INTO counter
  FROM public.receipts
  WHERE invoice_number LIKE (prefix || date_format || '-%');
  
  -- Format counter with leading zeros (4 digits)
  invoice_number := invoice_number || LPAD(counter::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$function$