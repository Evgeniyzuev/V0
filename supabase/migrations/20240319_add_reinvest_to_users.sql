alter table users add column if not exists reinvest integer not null default 100;
alter table users add constraint reinvest_range check (reinvest >= 50 and reinvest <= 100); 