-- Migration 013: Opt-in community showcase for public wedding cards

alter table public.wedding_cards
  add column if not exists show_in_showcase boolean not null default false;

comment on column public.wedding_cards.show_in_showcase is
  'When true and status=active, card appears on /cac-cap-doi community page';

create index if not exists wedding_cards_showcase_idx
  on public.wedding_cards (show_in_showcase, status, view_count desc)
  where show_in_showcase = true and status = 'active';
