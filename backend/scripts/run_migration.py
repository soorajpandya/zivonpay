"""Run payment_intents migration"""
import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.config import settings


async def run():
    import asyncpg

    url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(url, ssl="prefer")

    with open("scripts/add_payment_intents.sql", "r") as f:
        sql = f.read()

    await conn.execute(sql)

    row = await conn.fetchval(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='payment_intents'"
    )
    print(f"payment_intents table exists: {row > 0}")
    await conn.close()


asyncio.run(run())
