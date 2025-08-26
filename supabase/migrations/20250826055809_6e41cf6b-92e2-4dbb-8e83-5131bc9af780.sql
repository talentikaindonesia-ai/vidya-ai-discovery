-- Fix function parameter defaults issue
-- Create secure function for transaction creation (used by payment gateway)
CREATE OR REPLACE FUNCTION create_payment_transaction(
  p_user_id UUID,
  p_transaction_type TEXT,
  p_amount INTEGER,
  p_subscription_id UUID DEFAULT NULL,
  p_currency TEXT DEFAULT 'IDR',
  p_payment_gateway TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  transaction_id UUID;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL OR p_transaction_type IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid transaction parameters';
  END IF;

  -- Insert transaction
  INSERT INTO public.payment_transactions (
    user_id,
    subscription_id,
    transaction_type,
    amount,
    currency,
    status,
    payment_gateway
  ) VALUES (
    p_user_id,
    p_subscription_id,
    p_transaction_type,
    p_amount,
    p_currency,
    'pending',
    p_payment_gateway
  ) RETURNING id INTO transaction_id;

  RETURN transaction_id;
END;
$$;

-- Create secure function for transaction status update
CREATE OR REPLACE FUNCTION update_transaction_status(
  p_transaction_id UUID,
  p_new_status TEXT,
  p_external_id TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  transaction_user_id UUID;
  current_status TEXT;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Get transaction details
  SELECT user_id, status INTO transaction_user_id, current_status
  FROM public.payment_transactions
  WHERE id = p_transaction_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  -- Security check: only owner or admin can update
  IF current_user_id != transaction_user_id AND NOT has_role(current_user_id, 'admin'::user_role) THEN
    RAISE EXCEPTION 'Unauthorized to update this transaction';
  END IF;

  -- Validate status transition
  IF current_status != 'pending' AND NOT has_role(current_user_id, 'admin'::user_role) THEN
    RAISE EXCEPTION 'Can only update pending transactions';
  END IF;

  -- Update transaction
  UPDATE public.payment_transactions 
  SET 
    status = p_new_status,
    external_transaction_id = COALESCE(p_external_id, external_transaction_id),
    payment_method = COALESCE(p_payment_method, payment_method),
    updated_at = now()
  WHERE id = p_transaction_id;

  RETURN TRUE;
END;
$$;