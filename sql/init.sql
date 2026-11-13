-- Optional schema for STUDY FOX (matches src/db/schema.ts / drizzle).
-- Run this in Supabase → SQL Editor (or any Postgres) and then set
-- DATABASE_URL on Vercel to enable OTP login, enrollments and progress sync.
-- Without it the app runs fine in Guest mode.

create table if not exists users (
  id            serial primary key,
  phone         varchar(20) not null unique,
  name          varchar(120),
  access_token  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists otps (
  id          serial primary key,
  phone       varchar(20) not null,
  otp         varchar(10) not null,
  expires_at  timestamptz not null,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists otps_phone_idx on otps (phone);

create table if not exists enrollments (
  id          serial primary key,
  phone       varchar(20) not null,
  batch_id    varchar(64) not null,
  batch_name  varchar(300),
  batch_data  jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists enrollments_phone_idx on enrollments (phone);

create table if not exists progress (
  id          serial primary key,
  phone       varchar(20) not null,
  content_id  varchar(64) not null,
  done        boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index if not exists progress_phone_content_idx on progress (phone, content_id);

create table if not exists history (
  id          serial primary key,
  phone       varchar(20) not null,
  subject_id  varchar(64),
  tag         varchar(64),
  kind        varchar(32),
  content_id  varchar(64),
  title       varchar(500),
  opened_at   timestamptz not null default now()
);
create index if not exists history_phone_idx on history (phone);

create table if not exists verify_tokens (
  id          serial primary key,
  token       varchar(128) not null unique,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create table if not exists app_settings (
  id     serial primary key,
  key    varchar(64) not null unique,
  value  text
);

-- defaults: browsing is open, no OTP gate
insert into app_settings (key, value) values ('loginRequired', 'false')
  on conflict (key) do nothing;
insert into app_settings (key, value) values ('verifyRequired', 'false')
  on conflict (key) do nothing;
