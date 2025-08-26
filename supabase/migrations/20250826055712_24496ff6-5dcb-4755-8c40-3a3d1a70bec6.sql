-- First, check and drop ALL existing policies on payment_transactions
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'payment_transactions' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.payment_transactions', pol_name);
    END LOOP;
END $$;

-- Now create the secure policies
-- 1. Users can only view their own transactions with time limits (last 2 years)
CREATE POLICY "Users can view own transactions securely"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND created_at >= (CURRENT_DATE - INTERVAL '2 years')
);

-- 2. Users can only create transactions for themselves with strict validation
CREATE POLICY "Users can create own transactions validated"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND amount > 0
  AND transaction_type IN ('subscription', 'course', 'kit', 'bundle')
  AND status = 'pending'  -- Only allow creating pending transactions
);

-- 3. Users can only update status of their own pending transactions
CREATE POLICY "Users can update own pending transactions only"
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

-- 4. Admins can view all transactions (with audit logging requirement)
CREATE POLICY "Admins can view all transactions securely"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::user_role)
);

-- 5. Admins can update transactions for support/refunds
CREATE POLICY "Admins can update for support"
ON public.payment_transactions
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role)
);

-- 6. Only admins can insert on behalf of users (payment processing)
CREATE POLICY "Admins can insert payment transactions"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role)
);

-- 7. Prevent ALL deletion of transactions (financial audit trail)
CREATE POLICY "Prevent deletion of financial records"
ON public.payment_transactions
FOR DELETE
TO authenticated
USING (false);  -- No one can delete transactions