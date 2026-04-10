import bcrypt
import asyncio
from sqlalchemy import text
from app.database import async_engine

KEY_ID = "key_test_T2OJM7u6C1AkHgjLmovVMg"
SECRET = "sec_sandbox_JAPAfh8sBedcxi6Dv9-BI63c--yZDtW6X1e0NcAjlOA"

LIVE_KEY_ID = "key_live_rIQJpoObMHW06O324fmMdA"
LIVE_SECRET = "sec_production_ExcnK5GDvmV-TpIY42yBESdxSjwBlysiZhrBjeCEG3U"

async def check():
    async with async_engine.connect() as conn:
        r = await conn.execute(text(f"SELECT api_key_id, api_secret_hash, live_api_key_id, live_api_secret_hash FROM merchants WHERE api_key_id = '{KEY_ID}'"))
        row = r.first()
        if row:
            # Test sandbox key
            h = row[1]
            result = bcrypt.checkpw(SECRET.encode("utf-8")[:72], h.encode("utf-8"))
            print(f"Sandbox key_id: {row[0]}")
            print(f"Sandbox verify: {result}")

            # Test live key 
            lh = row[3]
            if lh:
                lresult = bcrypt.checkpw(LIVE_SECRET.encode("utf-8")[:72], lh.encode("utf-8"))
                print(f"Live key_id: {row[2]}")
                print(f"Live verify: {lresult}")
        else:
            print("NOT FOUND")

asyncio.run(check())
