-- Schema for BookVault Database

-- 1. Create books table
create table if not exists public.books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  author text not null,
  genre text,
  total_pages integer not null check (total_pages > 0),
  current_page integer default 0 not null check (current_page >= 0),
  status text default 'Not Started' not null check (status in ('Not Started', 'Reading', 'Completed', 'Wishlist')),
  rating integer check (rating >= 1 and rating <= 5),
  date_started date,
  date_finished date,
  cover_url text,
  isbn text,
  publisher text,
  purchase_date date,
  notes text,
  is_favorite boolean default false,
  source text,
  -- Wishlist specific fields
  price numeric(10, 2),
  priority text check (priority in ('Low', 'Medium', 'High')),
  purchase_link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on books
alter table public.books enable row level security;

-- Policies for books
create policy "Users can view their own books" on public.books
  for select using (auth.uid() = user_id);

create policy "Users can insert their own books" on public.books
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own books" on public.books
  for update using (auth.uid() = user_id);

create policy "Users can delete their own books" on public.books
  for delete using (auth.uid() = user_id);


-- 2. Create reading_logs table
create table if not exists public.reading_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  date date default current_date not null,
  pages_read integer not null check (pages_read > 0),
  current_page integer not null check (current_page >= 0),
  reading_time integer check (reading_time >= 0), -- in minutes
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on reading_logs
alter table public.reading_logs enable row level security;

-- Policies for reading_logs
create policy "Users can view their own reading logs" on public.reading_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert their own reading logs" on public.reading_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own reading logs" on public.reading_logs
  for update using (auth.uid() = user_id);

create policy "Users can delete their own reading logs" on public.reading_logs
  for delete using (auth.uid() = user_id);


-- 3. Create reading_goals table
create table if not exists public.reading_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  pages_per_day integer default 20 not null,
  books_per_year integer default 12 not null,
  year integer default extract(year from current_date)::integer not null,
  unique(user_id, year)
);

-- Enable RLS on reading_goals
alter table public.reading_goals enable row level security;

-- Policies for reading_goals
create policy "Users can view their own reading goals" on public.reading_goals
  for select using (auth.uid() = user_id);

create policy "Users can insert their own reading goals" on public.reading_goals
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own reading goals" on public.reading_goals
  for update using (auth.uid() = user_id);

create policy "Users can delete their own reading goals" on public.reading_goals
  for delete using (auth.uid() = user_id);


-- Indexes for optimization
create index if not exists books_user_id_idx on public.books(user_id);
create index if not exists reading_logs_user_id_idx on public.reading_logs(user_id);
create index if not exists reading_logs_book_id_idx on public.reading_logs(book_id);
create index if not exists reading_goals_user_id_idx on public.reading_goals(user_id);
