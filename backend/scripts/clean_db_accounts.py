import asyncio
from sqlalchemy import delete
from app.database.session import async_session_maker
from app.domain.models.user import User

async def main():
    print("Cleaning database of custom accounts...")
    try:
        async with async_session_maker() as db:
            stmt = delete(User).where(User.email.notin_([
                "admin@wildlife.gov",
                "officer@wildlife.gov",
                "researcher@wildlife.gov"
            ]))
            res = await db.execute(stmt)
            await db.commit()
            print(" -> Successfully removed custom registered user accounts!")
    except Exception as e:
        print(f" -> Error cleaning database: {e}")

if __name__ == "__main__":
    asyncio.run(main())
