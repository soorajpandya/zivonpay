"""Check payment_intents table state"""
import asyncio, sys
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
from app.config import settings

async def run():
    import asyncpg
    url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(url, ssl="prefer")

    rows = await conn.fetch(
        "SELECT short_id, order_id, status, merchant_id FROM payment_intents ORDER BY created_at DESC LIMIT 10"
    )
    for r in rows:
        print(dict(r))

    count = await conn.fetchval("SELECT count(1) FROM payment_intents")
    print(f"Total intents: {count}")

    constraints = await conn.fetch(
        "SELECT conname, contype FROM pg_constraint WHERE conrelid = 'payment_intents'::regclass"
    )
    for c in constraints:
        print(f"Constraint: {dict(c)}")

    await conn.close()

asyncio.run(run())
