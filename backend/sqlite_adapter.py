"""
Motor-compatible SQLite adapter for single-user local storage.
Mimics the small subset of Motor API used in server.py:
- db[name] or db.name -> Collection
- coll.find(query, projection).to_list(n)
- coll.find_one(query, projection)
- coll.insert_one(doc)
- coll.update_one(query, {"$set": {...}})
- coll.delete_one(query)
- coll.count_documents(query)

Storage: one table per collection. Rows: (id TEXT PK, data TEXT JSON).
Supports simple equality queries + {"$or": [...]}.
"""
import aiosqlite
import json
import os
from pathlib import Path


class _Cursor:
    def __init__(self, coll, query):
        self.coll = coll
        self.query = query or {}

    async def to_list(self, length=None):
        rows = await self.coll._select(self.query, limit=length)
        return [json.loads(r[1]) for r in rows]


def _build_where(query):
    """Return (sql_where, params) for the query. Empty query -> ('', [])."""
    if not query:
        return "", []
    if "$or" in query:
        clauses, params = [], []
        for sub in query["$or"]:
            sub_sql, sub_params = _build_where(sub)
            if sub_sql:
                clauses.append(f"({sub_sql[len(' WHERE '):]})")
                params.extend(sub_params)
        if not clauses:
            return "", []
        return " WHERE " + " OR ".join(clauses), params
    clauses, params = [], []
    for k, v in query.items():
        if k == "id":
            clauses.append("id = ?")
            params.append(v)
        else:
            clauses.append(f"json_extract(data, '$.{k}') = ?")
            params.append(v)
    return (" WHERE " + " AND ".join(clauses)) if clauses else "", params


class _UpdateResult:
    def __init__(self, matched, modified):
        self.matched_count = matched
        self.modified_count = modified


class _DeleteResult:
    def __init__(self, deleted):
        self.deleted_count = deleted


class Collection:
    def __init__(self, db, name):
        self.db = db
        self.name = name

    async def _ensure(self, conn):
        await conn.execute(
            f"CREATE TABLE IF NOT EXISTS {self.name} (id TEXT PRIMARY KEY, data TEXT NOT NULL)"
        )

    async def _select(self, query, limit=None):
        where, params = _build_where(query)
        sql = f"SELECT id, data FROM {self.name}{where}"
        if limit is not None:
            sql += f" LIMIT {int(limit)}"
        async with aiosqlite.connect(self.db.path) as conn:
            await self._ensure(conn)
            async with conn.execute(sql, params) as cur:
                return await cur.fetchall()

    def find(self, query=None, projection=None):
        return _Cursor(self, query or {})

    async def find_one(self, query, projection=None):
        rows = await self._select(query, limit=1)
        return json.loads(rows[0][1]) if rows else None

    async def insert_one(self, doc):
        doc_id = doc.get("id")
        if not doc_id:
            import uuid
            doc_id = str(uuid.uuid4())
            doc["id"] = doc_id
        async with aiosqlite.connect(self.db.path) as conn:
            await self._ensure(conn)
            await conn.execute(
                f"INSERT OR REPLACE INTO {self.name} (id, data) VALUES (?, ?)",
                (doc_id, json.dumps(doc, ensure_ascii=False)),
            )
            await conn.commit()
        return type("R", (), {"inserted_id": doc_id})()

    async def update_one(self, query, update):
        rows = await self._select(query, limit=1)
        if not rows:
            return _UpdateResult(0, 0)
        doc = json.loads(rows[0][1])
        set_part = update.get("$set", {})
        doc.update(set_part)
        async with aiosqlite.connect(self.db.path) as conn:
            await self._ensure(conn)
            await conn.execute(
                f"UPDATE {self.name} SET data = ? WHERE id = ?",
                (json.dumps(doc, ensure_ascii=False), rows[0][0]),
            )
            await conn.commit()
        return _UpdateResult(1, 1)

    async def delete_one(self, query):
        rows = await self._select(query, limit=1)
        if not rows:
            return _DeleteResult(0)
        async with aiosqlite.connect(self.db.path) as conn:
            await self._ensure(conn)
            await conn.execute(f"DELETE FROM {self.name} WHERE id = ?", (rows[0][0],))
            await conn.commit()
        return _DeleteResult(1)

    async def count_documents(self, query):
        where, params = _build_where(query)
        async with aiosqlite.connect(self.db.path) as conn:
            await self._ensure(conn)
            async with conn.execute(f"SELECT COUNT(*) FROM {self.name}{where}", params) as cur:
                row = await cur.fetchone()
                return row[0] if row else 0


class DB:
    def __init__(self, path):
        self.path = str(path)
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)

    def __getitem__(self, name):
        return Collection(self, name)

    def __getattr__(self, name):
        # Fallback for db.some_collection style access
        if name.startswith("_"):
            raise AttributeError(name)
        return Collection(self, name)


def get_db():
    """Return DB instance based on SQLITE_DB_PATH env var (default: ./data/systemforvalter.db)."""
    default = str(Path(__file__).parent / "data" / "systemforvalter.db")
    path = os.environ.get("SQLITE_DB_PATH") or default
    return DB(path)
