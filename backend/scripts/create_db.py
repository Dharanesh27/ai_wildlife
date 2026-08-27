import asyncio
import asyncpg
import sys

async def main():
    print("Re-creating 'ai_wildlife' database...")
    try:
        # Connect to template database postgres
        conn = await asyncpg.connect(
            user='postgres',
            password='postgres',
            database='postgres',
            host='localhost',
            timeout=5.0
        )
        
        # Terminate any active connections to database before dropping
        await conn.execute("""
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = 'ai_wildlife'
              AND pid <> pg_backend_pid();
        """)
        
        # Drop database if exists
        await conn.execute("DROP DATABASE IF EXISTS ai_wildlife")
        
        # Create database fresh
        await conn.execute("CREATE DATABASE ai_wildlife")
        print(" -> Re-created database 'ai_wildlife' successfully!")
        
        await conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"Error re-creating database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
