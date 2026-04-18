import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

DB_URL = (
    f"mysql+aiomysql://{os.environ.get('DB_USER','root')}:"
    f"{os.environ.get('DB_PASS','root')}@"
    f"{os.environ.get('DB_HOST','localhost')}/"
    f"{os.environ.get('DB_NAME','tasks_db')}"
)

engine = create_async_engine(DB_URL, echo=False, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with SessionLocal() as session:
        yield session
