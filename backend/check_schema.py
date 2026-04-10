import asyncio
import asyncpg

async def check():
    conn = await asyncpg.connect(
        'postgresql://postgres.cieojfzmsqfwmcwsyxvv:Burptech10102023@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
    )
    rows = await conn.fetch(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'merchants' ORDER BY ordinal_position"
    )
    print("Current merchants columns:")
    for r in rows:
        print(f"  - {r['column_name']}")
    await conn.close()

asyncio.run(check())
