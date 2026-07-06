# Systemforvalter-app — Lokal installation

Personligt arbejdsredskab for systemforvalter. **Alle data gemmes lokalt på din PC** i en SQLite-fil. Ingen data forlader maskinen.

---

## 1. Systemkrav

| Komponent | Version | Windows | macOS | Linux |
|-----------|---------|---------|-------|-------|
| Python    | 3.11+   | ✅      | ✅    | ✅    |
| Node.js   | 20+     | ✅      | ✅    | ✅    |
| Yarn      | 1.22+   | ✅      | ✅    | ✅    |

Ingen ekstern database — SQLite kommer indbygget i Python.

---

## 2. Installation

### Windows

```powershell
# 1. Klon repo
git clone <repo-url> C:\Users\%USERNAME%\app
cd C:\Users\%USERNAME%\app

# 2. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# 3. Frontend
cd ..\frontend
npm install --global yarn
yarn install
```

### macOS

```bash
brew install python@3.11 node yarn
git clone <repo-url> ~/systemforvalter
cd ~/systemforvalter/backend
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cd ../frontend && yarn install
```

### Linux (Ubuntu/Debian)

```bash
sudo apt install python3.11 python3.11-venv nodejs npm
sudo npm install -g yarn
git clone <repo-url> ~/systemforvalter
cd ~/systemforvalter/backend
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cd ../frontend && yarn install
```

---

## 3. Konfiguration af data-placering

Databasen ligger som **én fil** (`systemforvalter.db`). Du bestemmer selv hvor.

### Vælg din egen placering

Rediger `backend/.env` og tilføj:

```
# Windows-eksempel:
SQLITE_DB_PATH=C:\Users\dit-brugernavn\app\db\systemforvalter.db

# macOS/Linux-eksempel:
SQLITE_DB_PATH=/Users/dit-brugernavn/app/db/systemforvalter.db
```

Hvis `SQLITE_DB_PATH` ikke er sat, bruges standardstien `backend/data/systemforvalter.db`.

Mappen bliver oprettet automatisk hvis den ikke findes.

### Anbefalede placeringer

| OS      | Anbefalet sti |
|---------|---------------|
| Windows | `C:\Users\%USERNAME%\Documents\Systemforvalter\systemforvalter.db` |
| macOS   | `~/Documents/Systemforvalter/systemforvalter.db` |
| Linux   | `~/Documents/Systemforvalter/systemforvalter.db` |

**Backup**: kopiér bare `.db`-filen — det er alt.

---

## 4. Start appen

Åbn to terminaler:

**Terminal 1 — Backend:**
```bash
cd backend
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
uvicorn server:app --host 127.0.0.1 --port 8001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
yarn start
```

Åbn browser på **http://localhost:3000** — appen er klar.

---

## 5. `.env`-filer

### `backend/.env`
```
SQLITE_DB_PATH=C:\Users\dit-brugernavn\app\db\systemforvalter.db
CORS_ORIGINS=http://localhost:3000
```

### `frontend/.env`
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## 6. Sikkerhed og dataansvar

- ✅ Al data er i én SQLite-fil på din PC.
- ✅ Ingen netværkstrafik forlader maskinen (bortset fra frontend↔backend på localhost).
- ✅ Ingen brugerkonti — designet til én bruger.
- ⚠️ Appen er et personligt arbejdsredskab. Brug den ikke til klassificerede eller journaliseringspligtige dokumenter — henvis via links til officielle systemer (ESDH/ServiceNow).

---

## 7. Backup og gendan

```bash
# Backup
cp systemforvalter.db systemforvalter-backup-2026-02-06.db

# Gendan
# Stop backend, erstat filen, start backend igen
```

---

## 8. Fejlfinding

**Backend starter ikke:** Tjek at port 8001 er ledig. Windows: `netstat -ano | findstr 8001`.

**Frontend viser "Network Error":** Verificér at `REACT_APP_BACKEND_URL` peger på `http://localhost:8001` og at backend kører.

**Database er "låst":** SQLite låser filen kort ved skrivning. Undgå at have flere backend-processer kørende samtidig.
