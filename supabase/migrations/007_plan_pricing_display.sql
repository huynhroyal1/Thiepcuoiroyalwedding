-- Add discount_percent and set Basic sell price when still free in DB

update public.website_settings
set value = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            coalesce(value, '{}'::jsonb),
            '{basic,discount_percent}',
            coalesce(value #> '{basic,discount_percent}', '49'::jsonb),
            true
          ),
          '{pro,discount_percent}',
          coalesce(value #> '{pro,discount_percent}', '49'::jsonb),
          true
        ),
        '{vip,discount_percent}',
        coalesce(value #> '{vip,discount_percent}', '52'::jsonb),
        true
      ),
      '{basic,price}',
      case
        when coalesce((value #>> '{basic,price}')::int, 0) = 0 then '198000'::jsonb
        else value #> '{basic,price}'
      end,
      true
    ),
    '{basic,description}',
    coalesce(
      value #> '{basic,description}',
      '"Gói Basic — thiệp cưới cơ bản"'::jsonb
    ),
    true
  ),
  '{basic,name}',
  coalesce(value #> '{basic,name}', '"Basic"'::jsonb),
  true
)
where key = 'plan_config';

-- Grandfather: thiệp đã active trước khi bật paywall vẫn dùng được
update public.wedding_cards
set paid_at = coalesce(paid_at, created_at)
where paid_at is null and status = 'active';
