-- Milestone 4: storage policies so admins can upload card images.

create policy "Anyone can read card images" on storage.objects
  for select using (bucket_id = 'card-images');

create policy "Admins can upload card images" on storage.objects
  for insert with check (bucket_id = 'card-images' and public.is_admin());

create policy "Admins can update card images" on storage.objects
  for update using (bucket_id = 'card-images' and public.is_admin())
  with check (bucket_id = 'card-images' and public.is_admin());

create policy "Admins can delete card images" on storage.objects
  for delete using (bucket_id = 'card-images' and public.is_admin());
