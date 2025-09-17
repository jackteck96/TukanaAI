-- Promote the first user to admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'raul-cordoni@hotmail.com';