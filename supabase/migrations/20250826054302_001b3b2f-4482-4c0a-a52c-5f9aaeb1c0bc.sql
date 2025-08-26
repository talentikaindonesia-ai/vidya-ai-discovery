-- Create subscription packages table
CREATE TABLE public.subscription_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('free', 'premium_individual', 'family', 'school')),
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_users INTEGER DEFAULT 1,
  max_courses INTEGER DEFAULT -1,
  max_opportunities INTEGER DEFAULT -1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  package_id UUID REFERENCES public.subscription_packages(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount_paid INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.user_subscriptions(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription', 'course', 'kit', 'bundle')),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  payment_gateway TEXT,
  external_transaction_id TEXT,
  invoice_number TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create voucher codes table
CREATE TABLE public.voucher_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  min_purchase_amount INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  applicable_packages TEXT[] DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create voucher usage table
CREATE TABLE public.voucher_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID REFERENCES public.voucher_codes(id),
  user_id UUID NOT NULL,
  transaction_id UUID REFERENCES public.payment_transactions(id),
  discount_applied INTEGER NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create one-time products table
CREATE TABLE public.one_time_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN ('course', 'kit', 'bootcamp', 'bundle')),
  price INTEGER NOT NULL,
  is_digital BOOLEAN DEFAULT true,
  thumbnail_url TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create affiliate/referral system
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  commission_rate INTEGER NOT NULL DEFAULT 10,
  total_referrals INTEGER DEFAULT 0,
  total_commission INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create referral usage table
CREATE TABLE public.referral_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID REFERENCES public.referral_codes(id),
  referred_user_id UUID NOT NULL,
  transaction_id UUID REFERENCES public.payment_transactions(id),
  commission_earned INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_packages
CREATE POLICY "Subscription packages are publicly readable" 
ON public.subscription_packages 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage subscription packages" 
ON public.subscription_packages 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
ON public.user_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" 
ON public.user_subscriptions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.payment_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" 
ON public.payment_transactions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for voucher_codes
CREATE POLICY "Voucher codes are publicly readable when active" 
ON public.voucher_codes 
FOR SELECT 
USING (is_active = true AND valid_from <= now() AND valid_until >= now());

CREATE POLICY "Admins can manage voucher codes" 
ON public.voucher_codes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for voucher_usage
CREATE POLICY "Users can view their own voucher usage" 
ON public.voucher_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voucher usage" 
ON public.voucher_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all voucher usage" 
ON public.voucher_usage 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for one_time_products
CREATE POLICY "Products are publicly readable when active" 
ON public.one_time_products 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage products" 
ON public.one_time_products 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral codes" 
ON public.referral_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes" 
ON public.referral_codes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes" 
ON public.referral_codes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all referral codes" 
ON public.referral_codes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for referral_usage
CREATE POLICY "Users can view referrals they made" 
ON public.referral_usage 
FOR SELECT 
USING (auth.uid() = referred_user_id OR EXISTS (
  SELECT 1 FROM public.referral_codes 
  WHERE id = referral_code_id AND user_id = auth.uid()
));

CREATE POLICY "System can create referral usage" 
ON public.referral_usage 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all referral usage" 
ON public.referral_usage 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create indexes for better performance
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_voucher_codes_code ON public.voucher_codes(code);
CREATE INDEX idx_voucher_usage_user_id ON public.voucher_usage(user_id);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);

-- Insert default subscription packages
INSERT INTO public.subscription_packages (name, type, price_monthly, price_yearly, features, max_users, max_courses, max_opportunities) VALUES
('Free Tier', 'free', 0, 0, '["Dashboard minat bakat", "Beberapa kursus gratis", "Limited opportunity board"]', 1, 3, 5),
('Premium Individual', 'premium_individual', 39000, 390000, '["Akses penuh Learning Hub", "Akses penuh Opportunity Board", "Tracking & portfolio digital", "Sertifikat", "1-on-1 konsultasi/bulan"]', 1, -1, -1),
('Premium Plus', 'premium_individual', 99000, 990000, '["Semua fitur Premium", "Advanced analytics", "Unlimited konsultasi", "Akses semua kursus premium", "Portfolio builder", "Networking events", "Mentorship program", "Certificate tracking", "Priority support"]', 1, -1, -1),
('Family Plan', 'family', 150000, 1500000, '["1 akun orang tua + 3 anak", "Monitoring dashboard anak", "Semua fitur Premium Individual"]', 4, -1, -1),
('School License', 'school', 3999000, 39990000, '["Multi-user dashboard", "Bulk student assessment", "Teacher admin panel", "Detailed reporting", "Custom branding", "Integration support", "Training sessions", "24/7 dedicated support", "Analytics & insights", "Progress monitoring"]', -1, -1, -1);

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- Create function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS void AS $$
BEGIN
    -- Update expired subscriptions
    UPDATE public.user_subscriptions 
    SET status = 'expired' 
    WHERE status = 'active' 
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_packages_updated_at
    BEFORE UPDATE ON public.subscription_packages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voucher_codes_updated_at
    BEFORE UPDATE ON public.voucher_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_one_time_products_updated_at
    BEFORE UPDATE ON public.one_time_products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referral_codes_updated_at
    BEFORE UPDATE ON public.referral_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();