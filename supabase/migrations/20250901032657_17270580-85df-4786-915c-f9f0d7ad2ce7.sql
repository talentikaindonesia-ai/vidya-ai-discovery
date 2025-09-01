-- Fix quiz leaderboard security issue
-- Replace the public read policy with authenticated-only access

DROP POLICY IF EXISTS "Quiz leaderboard is publicly readable" ON public.quiz_leaderboard;

CREATE POLICY "Authenticated users can view quiz leaderboard"
ON public.quiz_leaderboard
FOR SELECT
TO authenticated
USING (true);

-- Also ensure users can only manage their own leaderboard stats (this policy already exists but let's confirm it's correct)
DROP POLICY IF EXISTS "Users can update their own leaderboard stats" ON public.quiz_leaderboard;

CREATE POLICY "Users can manage their own leaderboard stats"
ON public.quiz_leaderboard
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);