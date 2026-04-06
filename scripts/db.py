"""Shared Supabase client for Python scripts."""

import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://ymqhermftostqzqfkspf.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def get_client() -> Client:
    """Return a Supabase client using the service role key."""
    if not SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "SUPABASE_SERVICE_KEY environment variable is required. "
            "Find it in Supabase Dashboard → Settings → API → service_role."
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
