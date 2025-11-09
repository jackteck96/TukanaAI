-- Clients table and RLS policies
-- Ensure table exists
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  company_name text not null,
  email text not null,
  phone text not null,
  cnpj text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  address_zipcode text,
  admin_full_name text,
  admin_cpf text,
  qualification_method text not null default 'company_fills',
  email_preference text not null default 'register_only',
  email_sent boolean not null default false,
  email_sent_at timestamp with time zone,
  registration_status text not null default 'pending',
  internal_notes text,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists idx_clients_company_email_unique on public.clients (company_id, email);

-- Trigger for updated_at
drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at before update on public.clients for each row execute function public.update_updated_at_column();

-- Enable RLS
alter table public.clients enable row level security;

-- Drop policies if they exist to avoid conflicts
drop policy if exists "Company staff can view clients" on public.clients;
drop policy if exists "Company staff can insert clients" on public.clients;
drop policy if exists "Company staff can update clients" on public.clients;
drop policy if exists "Client can view own client record" on public.clients;

-- Recreate policies
create policy "Company staff can view clients" on public.clients for select
  using (user_belongs_to_company(auth.uid(), company_id) or is_platform_admin(auth.uid()));

create policy "Company staff can insert clients" on public.clients for insert
  with check (user_belongs_to_company(auth.uid(), company_id) or is_platform_admin(auth.uid()));

create policy "Company staff can update clients" on public.clients for update
  using (user_belongs_to_company(auth.uid(), company_id) or is_platform_admin(auth.uid()))
  with check (user_belongs_to_company(auth.uid(), company_id) or is_platform_admin(auth.uid()));

create policy "Client can view own client record" on public.clients for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.email = public.clients.email
    )
  );