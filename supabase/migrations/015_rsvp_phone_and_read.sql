-- Add phone column to rsvp table for wish+rsvp combined form
alter table public.rsvp add column if not exists phone text;

-- RLS: allow public to read RSVPs for active cards (so hosts can see who confirmed)
drop policy if exists "Owner can view RSVPs" on public.rsvp;
create policy "Owner can view RSVPs"
  on public.rsvp for select
  using (exists (select 1 from public.wedding_cards wc where wc.id = card_id and wc.user_id = auth.uid()));
create policy "Owner can update RSVPs"
  on public.rsvp for update
  using (exists (select 1 from public.wedding_cards wc where wc.id = card_id and wc.user_id = auth.uid()));
