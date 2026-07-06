import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    print("Supabase credentials not found in .env")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

print("Deleting all checkins...")
# To delete all rows, we can match on something that is always true, like id is not null
supabase.table("checkins").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

print("Deleting all users...")
supabase.table("users").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

print("Database reset complete!")
