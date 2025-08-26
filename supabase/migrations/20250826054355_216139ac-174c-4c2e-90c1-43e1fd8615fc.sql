-- Fix security function issues by setting search_path
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invoice_num TEXT;
    counter INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 9) AS INTEGER)), 0) + 1
    INTO counter
    FROM public.payment_transactions
    WHERE invoice_number LIKE 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '%';
    
    invoice_num := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || LPAD(counter::TEXT, 6, '0');
    RETURN invoice_num;
END;
$$;

CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update expired subscriptions
    UPDATE public.user_subscriptions 
    SET status = 'expired' 
    WHERE status = 'active' 
    AND expires_at < now();
END;
$$;