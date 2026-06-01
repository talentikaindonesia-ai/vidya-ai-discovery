-- ─── Revenue Improvements Migration ─────────────────────────────────────────
-- Covers: nudge suppression, referral program, sponsored opportunities,
--         subscription pause, award_xp RPC fix

-- 1. Upgrade nudge suppression tracking
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS upgrade_nudge_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS expiry_warning_7d_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS expiry_warning_3d_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS expiry_warning_1d_sent_at timestamptz;

-- 2. Referral program
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code varchar(12) UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_reward_given boolean DEFAULT false;

-- Auto-generate referral code on insert
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_referral_code ON profiles;
CREATE TRIGGER trg_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- Backfill existing profiles that don't have a referral code
UPDATE profiles
SET referral_code = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE referral_code IS NULL;

-- 3. Sponsored opportunities
ALTER TABLE scraped_content
  ADD COLUMN IF NOT EXISTS is_sponsored   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sponsor_badge  text,
  ADD COLUMN IF NOT EXISTS sponsor_cta    text,
  ADD COLUMN IF NOT EXISTS sponsor_until  timestamptz;

CREATE INDEX IF NOT EXISTS idx_scraped_content_sponsored
  ON scraped_content(is_sponsored) WHERE is_sponsored = true;

-- 4. Subscription pause support
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS paused_at    timestamptz,
  ADD COLUMN IF NOT EXISTS resume_at    timestamptz,
  ADD COLUMN IF NOT EXISTS pause_reason text;

-- 5. Atomic award_xp RPC (fixes race condition)
CREATE OR REPLACE FUNCTION award_xp(p_user_id uuid, p_amount int, p_reason text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row      user_xp%ROWTYPE;
  v_new_xp   int;
  v_new_lvl  int;
  v_leveled  bool;
BEGIN
  -- Lock the row for this user
  SELECT * INTO v_row FROM user_xp WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    -- Bootstrap new user
    INSERT INTO user_xp(user_id, current_xp, current_level, total_xp_earned)
    VALUES (p_user_id, p_amount, 1, p_amount)
    RETURNING * INTO v_row;
    v_new_xp  := p_amount;
    v_new_lvl := 1;
    v_leveled := false;
  ELSE
    v_new_xp  := v_row.current_xp + p_amount;
    -- Exponential curve: level = floor(sqrt(total_xp / 100))
    v_new_lvl := GREATEST(1, FLOOR(SQRT(v_new_xp::float / 100.0))::int);
    v_leveled := v_new_lvl > v_row.current_level;

    UPDATE user_xp SET
      current_xp      = v_new_xp,
      current_level   = v_new_lvl,
      total_xp_earned = total_xp_earned + p_amount
    WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'current_xp',  v_new_xp,
    'current_level', v_new_lvl,
    'leveled_up',  v_leveled,
    'amount',      p_amount,
    'reason',      p_reason
  );
END;
$$;

GRANT EXECUTE ON FUNCTION award_xp(uuid, int, text) TO authenticated;
