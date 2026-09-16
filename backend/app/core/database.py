import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

db_url = settings.DATABASE_URL
if "+aiosqlite" in db_url:
    db_url = db_url.replace("+aiosqlite", "")

engine = create_engine(
    db_url,
    echo=False,
    connect_args={"check_same_thread": False}
)

SyncSessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

Base = declarative_base()

class AsyncSessionWrapper:
    def __init__(self, sync_session: Session):
        self._sync = sync_session

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    def add(self, instance):
        self._sync.add(instance)

    async def commit(self):
        await asyncio.to_thread(self._sync.commit)

    async def rollback(self):
        await asyncio.to_thread(self._sync.rollback)

    async def refresh(self, instance):
        await asyncio.to_thread(self._sync.refresh, instance)

    async def get(self, entity, ident):
        return await asyncio.to_thread(self._sync.get, entity, ident)

    async def execute(self, statement, *args, **kwargs):
        return await asyncio.to_thread(self._sync.execute, statement, *args, **kwargs)

    async def delete(self, instance):
        await asyncio.to_thread(self._sync.delete, instance)

    async def close(self):
        await asyncio.to_thread(self._sync.close)

def AsyncSessionLocal():
    return AsyncSessionWrapper(SyncSessionLocal())

async def get_db():
    session = AsyncSessionLocal()
    try:
        yield session
    finally:
        await session.close()

async def init_db():
    await asyncio.to_thread(Base.metadata.create_all, bind=engine)
