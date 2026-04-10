"""Run security layer SQL migration"""
import asyncio
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text

async def run():
    sql = open("scripts/migration_security_layer.sql", encoding="utf-8").read()
    async with engine.begin() as conn:
        for stmt in sql.split(";"):
            s = stmt.strip()
            if s and not s.startswith("--"):
                try:
                    await conn.execute(text(s))
                except Exception as e:
                    print(f"WARN: {e}")
    print("Migration complete!")

asyncio.run(run())
