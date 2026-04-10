"""Test Supabase connection - diagnose 'Tenant or user not found' error"""
import asyncio
import sys

async def test_connections():
    try:
        import asyncpg
    except ImportError:
        print("ERROR: asyncpg not installed")
        sys.exit(1)
    
    # Connection configs to test
    configs = [
        {
            "name": "Pooler Transaction Mode (port 6543)",
            "host": "aws-0-ap-south-1.pooler.supabase.com",
            "port": 6543,
            "user": "postgres.cieojfzmsqfwmcwsyxvv",
            "password": "Burptech10102023",
            "database": "postgres",
        },
        {
            "name": "Pooler Session Mode (port 5432)",
            "host": "aws-0-ap-south-1.pooler.supabase.com",
            "port": 5432,
            "user": "postgres.cieojfzmsqfwmcwsyxvv",
            "password": "Burptech10102023",
            "database": "postgres",
        },
        {
            "name": "Direct Connection (port 5432)",
            "host": "db.cieojfzmsqfwmcwsyxvv.supabase.co",
            "port": 5432,
            "user": "postgres",
            "password": "Burptech10102023",
            "database": "postgres",
        },
    ]
    
    for config in configs:
        name = config.pop("name")
        print(f"\n{'='*60}")
        print(f"Testing: {name}")
        print(f"  Host: {config['host']}:{config['port']}")
        print(f"  User: {config['user']}")
        print(f"  DB:   {config['database']}")
        print(f"{'='*60}")
        
        try:
            conn = await asyncio.wait_for(
                asyncpg.connect(**config, ssl="prefer"),
                timeout=30
            )
            # If connected, test a simple query
            version = await conn.fetchval("SELECT version()")
            print(f"  SUCCESS! Connected.")
            print(f"  PostgreSQL: {version[:60]}...")
            
            # Check RLS status
            rows = await conn.fetch("""
                SELECT tablename, rowsecurity 
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename
            """)
            if rows:
                print(f"  Tables found: {len(rows)}")
                for row in rows:
                    rls_status = "RLS ON" if row['rowsecurity'] else "RLS OFF"
                    print(f"    - {row['tablename']}: {rls_status}")
            else:
                print("  No tables found in public schema")
            
            await conn.close()
            return  # Stop after first success
            
        except asyncio.TimeoutError:
            print(f"  FAILED: Connection timed out (30s)")
        except Exception as e:
            print(f"  FAILED: {type(e).__name__}: {e}")
    
    print("\n\nAll connection methods failed!")
    print("\nPossible fixes:")
    print("1. Check your database password in Supabase Dashboard > Settings > Database")
    print("2. Verify project is not paused")
    print("3. Reset database password in Supabase Dashboard")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_connections())
