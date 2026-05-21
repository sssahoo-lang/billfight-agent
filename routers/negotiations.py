from fastapi import APIRouter, HTTPException
import aiosqlite, json
from database import DB_PATH

router = APIRouter()

@router.get("/")
async def list_negotiations():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT n.*, b.provider, b.current_amount, b.bill_type, b.filename FROM negotiations n JOIN bills b ON n.bill_id = b.id ORDER BY n.created_at DESC") as cursor:
            return [dict(r) for r in await cursor.fetchall()]

@router.get("/{negotiation_id}")
async def get_negotiation(negotiation_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT n.*, b.provider, b.current_amount, b.bill_type, b.filename, b.extracted_data FROM negotiations n JOIN bills b ON n.bill_id = b.id WHERE n.id = ?", (negotiation_id,)) as cursor:
            row = await cursor.fetchone()
            if not row: raise HTTPException(404, "Not found")
            neg = dict(row)
        async with db.execute("SELECT * FROM negotiation_steps WHERE negotiation_id = ? ORDER BY created_at ASC", (negotiation_id,)) as cursor:
            steps = [dict(r) for r in await cursor.fetchall()]
        for step in steps:
            if step.get('content'):
                try: step['content'] = json.loads(step['content'])
                except: pass
        for field in ['research_findings', 'strategy', 'extracted_data']:
            if neg.get(field):
                try: neg[field] = json.loads(neg[field])
                except: pass
        neg['steps'] = steps
        return neg
