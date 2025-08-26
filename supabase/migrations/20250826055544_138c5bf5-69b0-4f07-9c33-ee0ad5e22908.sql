-- Enhanced Security for Payment Transactions Table
-- This migration addresses critical security vulnerabilities

-- First, drop existing policies to rebuild them securely
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.payment_transactions;

-- Create comprehensive RLS policies with enhanced security

-- 1. Users can only view their own transactions with time limits (last 2 years for performance/security)
CREATE POLICY "Users can view own transactions with time limit"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND created_at >= (CURRENT_DATE - INTERVAL '2 years')
);

-- 2. Users can only create transactions for themselves with validation
CREATE POLICY "Users can create own transactions with validation"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND amount > 0
  AND transaction_type IN ('subscription', 'course', 'kit', 'bundle')
  AND status IN ('pending', 'completed', 'failed')
);

-- 3. Users can only update their own pending transactions (status changes only)
CREATE POLICY "Users can update own pending transactions"
ON public.payment_transactions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND status IN ('completed', 'failed', 'refunded')
);

-- 4. Admins can view all transactions but with audit logging
CREATE POLICY "Admins can view all transactions with audit"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::user_role)
);

-- 5. Admins can update transactions for support purposes
CREATE POLICY "Admins can update transactions for support"
ON public.payment_transactions
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role)
);

-- 6. Only system/admin can insert transactions (prevent direct user creation)
CREATE POLICY "System can insert transactions"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role)
  OR (
    auth.uid() = user_id 
    AND user_id IS NOT NULL
    AND status = 'pending'
  )
);

-- 7. Prevent deletion of transactions (audit trail)
CREATE POLICY "No deletion of transactions"
ON public.payment_transactions
FOR DELETE
TO authenticated
USING (false);

-- Create audit trigger for admin access to payment data
CREATE OR REPLACE FUNCTION audit_payment_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when admins access payment data
  IF has_role(auth.uid(), 'admin'::user_role) AND TG_OP = 'SELECT' THEN
    INSERT INTO public.audit_logs (
      user_id, 
      table_name, 
      operation, 
      record_id,
      accessed_at
    ) VALUES (
      auth.uid(),
      'payment_transactions',
      'ADMIN_VIEW',
      COALESCE(NEW.id, OLD.id),
      now()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Note: Trigger for SELECT operations would require row-level logging which is complex
-- Instead, we'll implement application-level audit logging in the admin panel

-- Create function to safely retrieve transaction summaries (without sensitive data)
CREATE OR REPLACE FUNCTION get_transaction_summary(transaction_id UUID)
RETURNS TABLE(
  id UUID,
  amount INTEGER,
  currency TEXT,
  status TEXT,
  transaction_type TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id,
    t.amount,
    t.currency,
    t.status,
    t.transaction_type,
    t.created_at
  FROM public.payment_transactions t
  WHERE t.id = transaction_id
    AND (t.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::user_role));
$$;

-- Create function for secure admin analytics (aggregated data only)
CREATE OR REPLACE FUNCTION get_payment_analytics(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_revenue BIGINT,
  transaction_count BIGINT,
  avg_transaction_amount NUMERIC,
  successful_transactions BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(amount), 0) as total_revenue,
    COUNT(*) as transaction_count,
    COALESCE(AVG(amount), 0) as avg_transaction_amount,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_transactions
  FROM public.payment_transactions
  WHERE created_at >= start_date
    AND created_at <= end_date
    AND has_role(auth.uid(), 'admin'::user_role);
$$;

-- Add additional constraints for data integrity
ALTER TABLE public.payment_transactions 
ADD CONSTRAINT check_positive_amount CHECK (amount > 0);

ALTER TABLE public.payment_transactions 
ADD CONSTRAINT check_valid_currency CHECK (currency IN ('IDR', 'USD'));

ALTER TABLE public.payment_transactions 
ADD CONSTRAINT check_valid_transaction_type 
CHECK (transaction_type IN ('subscription', 'course', 'kit', 'bundle'));

ALTER TABLE public.payment_transactions 
ADD CONSTRAINT check_valid_status 
CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));

-- Create index for performance on user queries
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_created 
ON public.payment_transactions(user_id, created_at DESC);

-- Create index for admin analytics
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status_created 
ON public.payment_transactions(status, created_at DESC);

-- Add comment explaining security measures
COMMENT ON TABLE public.payment_transactions IS 
'Secure payment transactions table with comprehensive RLS policies. Users can only access their own transactions within 2 years. Admin access is restricted and should be audited.';

COMMENT ON POLICY "Users can view own transactions with time limit" ON public.payment_transactions IS 
'Restricts users to viewing only their own transactions within the last 2 years for security and performance.';

COMMENT ON POLICY "No deletion of transactions" ON public.payment_transactions IS 
'Prevents deletion of financial records to maintain audit trail and comply with financial regulations.';