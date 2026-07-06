from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, date

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ----- Helpers -----
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def today_iso() -> str:
    return date.today().isoformat()


def gen_id() -> str:
    return str(uuid.uuid4())


def clean(doc):
    if doc is None:
        return None
    doc.pop('_id', None)
    return doc


# ----- Models -----
class SystemModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    navn: str
    status: str = "Aktiv"                       # Aktiv | Under udfasning | Lukket | På vej ind
    kritikalitet: str = "Middel"                # Lav | Middel | Høj | Kritisk
    leverandor_id: Optional[str] = None
    driftsleverandor_id: Optional[str] = None
    driftsmodel: Optional[str] = None
    systemejer: Optional[str] = None
    dataejer: Optional[str] = None
    servicenow_link: Optional[str] = None
    dokumentation_link: Optional[str] = None
    aftaler_link: Optional[str] = None
    beskrivelse: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class OrganizationModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    navn: str
    type: str = "Ukendt/andet"
    primaer_kontakt_id: Optional[str] = None
    website: Optional[str] = None
    noter: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class ContactModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    navn: str
    organization_id: Optional[str] = None
    kontakttype: str = "Anden kontakt"
    titel: Optional[str] = None
    email: Optional[str] = None
    telefon: Optional[str] = None
    noter: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class SystemContactModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    system_id: str
    contact_id: str
    kategori: str = "Anden kontakt"           # Leverandørkontakt | Intern interessent | Intern vidensperson | Anden kontakt
    rolle: str = "Andet"
    status: str = "Aktiv"                       # Aktiv | Historisk | Usikker
    ansvar: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class TaskModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    titel: str
    system_id: Optional[str] = None
    kanban_kolonne: str = "Todo"
    status: str = "Ikke startet"                # Ikke startet | I gang | Afventer | Færdig
    prioritet: str = "Normal"                   # Lav | Normal | Høj | Kritisk
    deadline: Optional[str] = None              # ISO date string
    afventer: Optional[str] = None
    naeste_handling: Optional[str] = None
    noter: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class KanbanColumnModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    navn: str
    order: int = 0


class LogEntryModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    titel: str
    dato: str = Field(default_factory=today_iso)
    system_id: Optional[str] = None
    type: str = "Andet"                         # Møde | Beslutning | Observation | Status | Leverandørdialog | Risiko | Andet
    emne: str = "Andet"                         # Drift | Leverandør | Arkitektur | Sikkerhed | Data/GDPR | Økonomi | Brugere/fagområde | Kontrakt/aftale | Andet
    resume: Optional[str] = None
    beslutning: Optional[str] = None
    opfoelgning: Optional[str] = None
    opfoelgningsfrist: Optional[str] = None     # ISO date
    kontakt_id: Optional[str] = None
    organization_id: Optional[str] = None
    officielt_link: Optional[str] = None
    detaljer: Optional[str] = None              # HTML from TipTap
    draft: bool = False
    created_at: str = Field(default_factory=now_iso)


# ----- Generic CRUD factory -----
def make_crud(collection_name: str, Model):
    router = APIRouter(prefix=f"/{collection_name}")

    @router.get("")
    async def list_items():
        items = await db[collection_name].find({}, {"_id": 0}).to_list(2000)
        return items

    @router.get("/{item_id}")
    async def get_item(item_id: str):
        doc = await db[collection_name].find_one({"id": item_id}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Ikke fundet")
        return doc

    @router.post("")
    async def create_item(payload: dict):
        obj = Model(**payload)
        doc = obj.model_dump()
        await db[collection_name].insert_one(doc)
        return clean(doc)

    @router.put("/{item_id}")
    async def update_item(item_id: str, payload: dict):
        payload.pop('id', None)
        payload.pop('_id', None)
        payload.pop('created_at', None)
        res = await db[collection_name].update_one({"id": item_id}, {"$set": payload})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Ikke fundet")
        doc = await db[collection_name].find_one({"id": item_id}, {"_id": 0})
        return doc

    @router.delete("/{item_id}")
    async def delete_item(item_id: str):
        res = await db[collection_name].delete_one({"id": item_id})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Ikke fundet")
        return {"ok": True}

    return router


# ----- Register CRUDs -----
api_router.include_router(make_crud("systems", SystemModel))
api_router.include_router(make_crud("organizations", OrganizationModel))
api_router.include_router(make_crud("contacts", ContactModel))
api_router.include_router(make_crud("system_contacts", SystemContactModel))
api_router.include_router(make_crud("tasks", TaskModel))
api_router.include_router(make_crud("kanban_columns", KanbanColumnModel))
api_router.include_router(make_crud("log_entries", LogEntryModel))


# ----- Extra endpoints -----
@api_router.get("/")
async def root():
    return {"message": "Systemforvalter API"}


@api_router.get("/systems/{system_id}/contacts")
async def system_contacts(system_id: str):
    """Returnerer systemkontakt-relationer beriget med kontakt- og organisationsdata."""
    rels = await db.system_contacts.find({"system_id": system_id}, {"_id": 0}).to_list(1000)
    out = []
    for r in rels:
        contact = await db.contacts.find_one({"id": r["contact_id"]}, {"_id": 0})
        org = None
        if contact and contact.get("organization_id"):
            org = await db.organizations.find_one({"id": contact["organization_id"]}, {"_id": 0})
        out.append({**r, "contact": contact, "organization": org})
    return out


@api_router.get("/systems/{system_id}/tasks")
async def system_tasks(system_id: str):
    return await db.tasks.find({"system_id": system_id}, {"_id": 0}).to_list(1000)


@api_router.get("/systems/{system_id}/log_entries")
async def system_log_entries(system_id: str):
    return await db.log_entries.find({"system_id": system_id}, {"_id": 0}).to_list(1000)


@api_router.get("/organizations/{org_id}/systems")
async def org_systems(org_id: str):
    docs = await db.systems.find(
        {"$or": [{"leverandor_id": org_id}, {"driftsleverandor_id": org_id}]},
        {"_id": 0},
    ).to_list(1000)
    return docs


@api_router.get("/organizations/{org_id}/contacts")
async def org_contacts(org_id: str):
    return await db.contacts.find({"organization_id": org_id}, {"_id": 0}).to_list(1000)


@api_router.get("/dashboard")
async def dashboard():
    tasks = await db.tasks.find({}, {"_id": 0}).to_list(5000)
    systems = await db.systems.find({}, {"_id": 0}).to_list(5000)
    logs = await db.log_entries.find({}, {"_id": 0}).to_list(5000)

    today = date.today().isoformat()
    aabne = [t for t in tasks if t.get("status") != "Færdig"]
    afventer = [t for t in tasks if t.get("status") == "Afventer"]
    forsinkede = [t for t in aabne if t.get("deadline") and t["deadline"] < today]
    vigtige = [t for t in aabne if t.get("prioritet") in ("Høj", "Kritisk")]

    kommende_opfoelgninger = sorted(
        [entry for entry in logs if entry.get("opfoelgningsfrist") and entry["opfoelgningsfrist"] >= today],
        key=lambda x: x["opfoelgningsfrist"],
    )[:5]

    kritiske_systemer = [s for s in systems if s.get("kritikalitet") in ("Høj", "Kritisk")]

    seneste_log = sorted(logs, key=lambda x: x.get("dato", ""), reverse=True)[:5]

    return {
        "antal_aabne_opgaver": len(aabne),
        "antal_afventer": len(afventer),
        "antal_forsinkede": len(forsinkede),
        "antal_systemer": len(systems),
        "kommende_opfoelgninger": kommende_opfoelgninger,
        "vigtige_opgaver": vigtige[:10],
        "kritiske_systemer": kritiske_systemer,
        "seneste_log": seneste_log,
    }


# ----- Seed -----
@api_router.post("/seed")
async def seed():
    # Only seed if empty
    existing = await db.systems.count_documents({})
    if existing > 0:
        return {"seeded": False, "reason": "Data findes allerede"}

    # Kanban columns
    for i, navn in enumerate(["Todo", "Doing", "Done"]):
        await db.kanban_columns.insert_one(KanbanColumnModel(navn=navn, order=i).model_dump())

    # Organizations
    org_kmd = OrganizationModel(navn="KMD A/S", type="Ekstern leverandør", website="https://www.kmd.dk").model_dump()
    org_netcompany = OrganizationModel(navn="Netcompany", type="Ekstern leverandør", website="https://www.netcompany.com").model_dump()
    org_statens_it = OrganizationModel(navn="Statens IT", type="Driftsleverandør", website="https://www.statens-it.dk").model_dump()
    org_intern = OrganizationModel(navn="Fagkontor Ydelser", type="Intern fagkontor").model_dump()
    for o in (org_kmd, org_netcompany, org_statens_it, org_intern):
        await db.organizations.insert_one(o)

    # Contacts
    c1 = ContactModel(navn="Mette Jensen", organization_id=org_kmd["id"], kontakttype="Leverandørkontakt",
                      titel="Kundeansvarlig", email="mette.jensen@kmd.dk", telefon="+45 12 34 56 78").model_dump()
    c2 = ContactModel(navn="Peter Sørensen", organization_id=org_netcompany["id"], kontakttype="Leverandørkontakt",
                      titel="Teknisk arkitekt", email="ps@netcompany.com").model_dump()
    c3 = ContactModel(navn="Anne Holm", organization_id=org_intern["id"], kontakttype="Intern interessent",
                      titel="Kontorchef", email="anne.holm@styrelsen.dk").model_dump()
    c4 = ContactModel(navn="Jonas Kristensen", organization_id=org_statens_it["id"], kontakttype="Leverandørkontakt",
                      titel="Driftsansvarlig", email="jkr@statens-it.dk").model_dump()
    for c in (c1, c2, c3, c4):
        await db.contacts.insert_one(c)

    # Systems
    s1 = SystemModel(
        navn="Ydelsessystem",
        status="Aktiv",
        kritikalitet="Kritisk",
        leverandor_id=org_kmd["id"],
        driftsleverandor_id=org_statens_it["id"],
        driftsmodel="On-premise",
        systemejer="Anne Holm",
        dataejer="Fagkontor Ydelser",
        servicenow_link="https://servicenow.example.dk/ydelsessystem",
        dokumentation_link="https://docs.example.dk/ydelsessystem",
        aftaler_link="https://esdh.example.dk/aftaler/ydelsessystem",
        beskrivelse="Fagsystem til udbetaling af ydelser.",
    ).model_dump()
    s2 = SystemModel(
        navn="Sagsbehandlingssystem",
        status="Aktiv",
        kritikalitet="Høj",
        leverandor_id=org_netcompany["id"],
        driftsleverandor_id=org_statens_it["id"],
        driftsmodel="SaaS",
        systemejer="Anne Holm",
        dataejer="Fagkontor Ydelser",
        servicenow_link="https://servicenow.example.dk/sagsbehandling",
    ).model_dump()
    s3 = SystemModel(
        navn="Gammelt arkivsystem",
        status="Under udfasning",
        kritikalitet="Lav",
        driftsmodel="On-premise",
    ).model_dump()
    for s in (s1, s2, s3):
        await db.systems.insert_one(s)

    # System-Contact relations
    scs = [
        SystemContactModel(system_id=s1["id"], contact_id=c1["id"], kategori="Leverandørkontakt",
                           rolle="Kontraktkontakt", status="Aktiv", ansvar="Primær kontaktperson hos leverandør").model_dump(),
        SystemContactModel(system_id=s1["id"], contact_id=c3["id"], kategori="Intern interessent",
                           rolle="Chef/ejer", status="Aktiv", ansvar="Systemejer").model_dump(),
        SystemContactModel(system_id=s1["id"], contact_id=c4["id"], kategori="Leverandørkontakt",
                           rolle="Driftskontakt", status="Aktiv").model_dump(),
        SystemContactModel(system_id=s2["id"], contact_id=c2["id"], kategori="Leverandørkontakt",
                           rolle="Teknisk kontakt", status="Aktiv").model_dump(),
        SystemContactModel(system_id=s2["id"], contact_id=c3["id"], kategori="Intern interessent",
                           rolle="Chef/ejer", status="Aktiv").model_dump(),
    ]
    for sc in scs:
        await db.system_contacts.insert_one(sc)

    # Tasks
    from datetime import timedelta
    d = date.today()
    tasks = [
        TaskModel(titel="Gennemgå ny release fra leverandør", system_id=s1["id"], kanban_kolonne="Todo",
                  status="Ikke startet", prioritet="Høj",
                  deadline=(d + timedelta(days=7)).isoformat(),
                  naeste_handling="Kalde til møde med KMD").model_dump(),
        TaskModel(titel="Følg op på GDPR-vurdering", system_id=s1["id"], kanban_kolonne="Doing",
                  status="I gang", prioritet="Kritisk",
                  deadline=(d - timedelta(days=2)).isoformat(),
                  afventer="DPO").model_dump(),
        TaskModel(titel="Bekræft supportaftale-fornyelse", system_id=s2["id"], kanban_kolonne="Todo",
                  status="Afventer", prioritet="Normal",
                  afventer="Kontraktkontor").model_dump(),
        TaskModel(titel="Arkiver gammel dokumentation", system_id=s3["id"], kanban_kolonne="Done",
                  status="Færdig", prioritet="Lav").model_dump(),
        TaskModel(titel="Ryd oplæg til styregruppe", kanban_kolonne="Todo",
                  status="Ikke startet", prioritet="Normal",
                  deadline=(d + timedelta(days=3)).isoformat()).model_dump(),
    ]
    for t in tasks:
        await db.tasks.insert_one(t)

    # Log entries
    logs = [
        LogEntryModel(titel="Statusmøde med KMD", dato=d.isoformat(), system_id=s1["id"],
                      type="Møde", emne="Leverandør",
                      resume="Gennemgang af releases og servicehændelser sidste kvartal.",
                      beslutning="Afvente detaljeret leveranceplan senest fredag.",
                      opfoelgning="Send opsamling til Anne Holm.",
                      opfoelgningsfrist=(d + timedelta(days=5)).isoformat(),
                      kontakt_id=c1["id"], organization_id=org_kmd["id"],
                      officielt_link="https://esdh.example.dk/sag/2024-1234").model_dump(),
        LogEntryModel(titel="Beslutning om driftsmodel", dato=(d - timedelta(days=10)).isoformat(),
                      system_id=s2["id"], type="Beslutning", emne="Arkitektur",
                      resume="Fastholder SaaS-model foreløbig.",
                      beslutning="Ingen migrering i 2025.").model_dump(),
        LogEntryModel(titel="Observation: langsomme svartider", dato=(d - timedelta(days=3)).isoformat(),
                      system_id=s1["id"], type="Observation", emne="Drift",
                      resume="Brugere melder om langsomme svartider fredage.",
                      opfoelgning="Bede Statens IT om måling.",
                      opfoelgningsfrist=(d + timedelta(days=2)).isoformat(),
                      kontakt_id=c4["id"]).model_dump(),
    ]
    for entry in logs:
        await db.log_entries.insert_one(entry)

    return {"seeded": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_seed():
    # Auto-seed on startup if empty (idempotent)
    try:
        count = await db.systems.count_documents({})
        if count == 0:
            logger.info("Ingen data fundet – seeder eksempeldata")
            # call seed logic via HTTP-free approach: re-use endpoint function
            await seed()
    except Exception as e:
        logger.error(f"Kunne ikke seede: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
