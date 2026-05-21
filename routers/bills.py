from fastapi import APIRouter, UploadFile, File, HTTPException
import aiosqlite, json, io
from database import DB_PATH
from agent_service import parse_bill
import pypdf

router = APIRouter()

def extract_text_from_pdf(file_bytes):
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    return "".join(p.extract_text() + "\n" for p in reader.pages).strip()

@router.post("/upload")
async def upload_bill(file: UploadFile = File(...)):
    if not file.filename.endswith(('.pdf', '.txt')):
        raise HTTPException(400, "Only PDF and TXT files supported")
    content = await file.read()
    raw_text = extract_text_from_pdf(content) if file.filename.endswith('.pdf') else content.decode('utf-8')
    if not raw_text.strip():
        raise HTTPException(400, "Could not extract text")
    extracted = parse_bill(raw_text)
    if not extracted:
        raise HTTPException(500, "Could not parse bill")
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("INSERT INTO bills (filename, provider, current_amount, account_tenure, contract_end, bill_type, raw_text, extracted_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (file.filename, extracted.get('provider','Unknown'), float(extracted.get('current_amount',0)), extracted.get('account_tenure','Unknown'), extracted.get('contract_end'), extracted.get('bill_type','other'), raw_text[:5000], json.dumps(extracted)))
        bill_id = cursor.lastrowid
        await db.commit()
    return {"bill_id": bill_id, "extracted": extracted, "message": "Bill parsed successfully"}

@router.get("/")
async def list_bills():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM bills ORDER BY created_at DESC") as cursor:
            return [dict(r) for r in await cursor.fetchall()]

@router.get("/{bill_id}")
async def get_bill(bill_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM bills WHERE id = ?", (bill_id,)) as cursor:
            row = await cursor.fetchone()
            if not row: raise HTTPException(404, "Not found")
            data = dict(row)
            if data.get('extracted_data'): data['extracted_data'] = json.loads(data['extracted_data'])
            return data
