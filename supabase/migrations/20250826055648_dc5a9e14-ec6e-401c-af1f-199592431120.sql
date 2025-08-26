-- Add additional security constraints and functions
-- These provide additional data integrity and security measures

-- Add constraints for data validation (only if they don't exist)
DO $$
BEGIN
    -- Check if constraint exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_positive_amount' 
        AND table_name = 'payment_transactions'
    ) THEN
        ALTER TABLE public.payment_transactions 
        ADD CONSTRAINT check_positive_amount CHECK (amount > 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_valid_currency' 
        AND table_name = 'payment_transactions'
    ) THEN
        ALTER TABLE public.payment_transactions 
        ADD CONSTRAINT check_valid_currency CHECK (currency IN ('IDR', 'USD'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_valid_transaction_type' 
        AND table_name = 'payment_transactions'
    ) THEN
        ALTER TABLE public.payment_transactions 
        ADD CONSTRAINT check_valid_transaction_type 
        CHECK (transaction_type IN ('subscription', 'course', 'kit', 'bundle'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_valid_status' 
        AND table_name = 'payment_transactions'
    ) THEN
        ALTER TABLE public.payment_transactions 
        ADD CONSTRAINT check_valid_status 
        CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));
    END IF;
END $$;

-- Create secure function for transaction creation (used by payment gateway)
CREATE OR REPLACE FUNCTION create_payment_transaction(
  p_user_id UUID,
  p_subscription_id UUID DEFAULT NULL,
  p_transaction_type TEXT,
  p_amount INTEGER,
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

-- Create indexes for better performance and security
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_created 
ON public.payment_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status_created 
ON public.payment_transactions(status, created_at DESC);

-- Add security comments
COMMENT ON TABLE public.payment_transactions IS 
'Secure payment transactions table with comprehensive RLS policies. Users can only access their own transactions within 2 years. Admin access should be audited.';

COMMENT ON FUNCTION create_payment_transaction IS 
'Secure function to create payment transactions. Validates inputs and enforces business rules.';

COMMENT ON FUNCTION update_transaction_status IS 
'Secure function to update transaction status. Enforces authorization and valid status transitions.';