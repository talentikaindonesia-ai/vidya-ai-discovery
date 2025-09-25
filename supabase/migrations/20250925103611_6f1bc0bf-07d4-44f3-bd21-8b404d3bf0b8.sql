-- Add admin role for current user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('a9603fea-f582-425d-adc9-1c44a21b1b3a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;