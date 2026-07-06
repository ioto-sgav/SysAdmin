# Personlig Systemforvalter-app — PRD

## Original problem statement
Dansk offentlig styrelses personlige arbejdsredskab for en systemforvalter til at holde overblik over fagsystemer, kontakter, organisationer, opgaver, logbog og opfølgninger. Ikke et officielt ESDH/journaliserings-/kontraktarkivsystem — links til officielle placeringer frem for kopier.

## User choices (v1)
- Ingen login (single-user, lokal brug)
- UI helt på dansk
- Seed med et par eksempler
- Lys, rolig, professionel Nordic offentlig myndighed-look
- Kun v1-minimum scope (ingen import/eksport i version 1)

## Architecture
- **Backend**: FastAPI + MongoDB (motor). Alle endpoints under `/api`, UUID-strenge som IDs (ingen ObjectId serialisering). Generisk CRUD-fabrik for 7 kollektioner + nestede `/systems/{id}/...` endpoints + `/dashboard` aggregat.
- **Frontend**: React 19 + React Router 7 + Tanstack Query + Shadcn/UI. Fixed sidebar layout (`w-64 ml-64`). Alle knapper/links har `data-testid`.

## What's been implemented (2026-02)
- Dashboard: 4 KPI-kort + 4 sektioner (kommende opfølgninger, vigtige opgaver, kritiske systemer, seneste logbog)
- Systemer: listeoversigt + søgning/status/kritikalitet-filter, oprette
- SystemDetalje: 4 accordion-sektioner (Systemoverblik/stamdata, Kontakter på systemet, Opgaver kanban, Logbog) — alle sammenklappelige
- Kontakter på systemet: filtrerbar tabel med kategori/rolle/status/ansvar; CRUD på relationen
- Kontakter: CRUD med filter på kontakttype
- Organisationer: CRUD med filter på type
- Opgaver: Kanban board (Todo/Doing/Done + custom kolonner, drag&drop, omdøb/slet kolonne)
- Logbog: filtrerbar liste (type, emne, kun-med-opfølgning), sammenfoldelig række-detalje, dagsdato som default
- Indstillinger: statisk info om afgrænsning, følsomme oplysninger
- Auto-seed ved opstart: 3 systemer, 4 organisationer, 4 kontakter, 5 opgaver, 3 logbogsposter

## v1 acceptkriterier — status
Alle 16 acceptkriterier fra § 20 er opfyldt.

## Backlog (P1)
- Import/eksport af egne data (JSON) og backup/gendan (§ 16)
- Yderligere sektioner på systemdetalje: Risici, Beslutninger, Økonomi, Årshjul, Revision/tilsyn (§ 6.6)

## Backlog (P2, senere versioner — § 19)
- Årshjul, risikoregister, beslutningsregister på tværs af systemer
- Fristoverblik, rapport-eksport
- Skabeloner for logbogsposter
- Notifikationer / påmindelser om opfølgningsfrister

## Update (2026-02) — Logbog-redesign
Efter brugerfeedback om at logbogen skal kunne bruges under aktive Teams-møder:

- **Sheet-panel** (Shadcn Sheet fra højre) erstatter modal-dialog. Klik-udenfor lukker IKKE, Esc lukker IKKE.
- **Auto-save**: Debounced (1.2s) skrivning til backend som `draft: true`. Live "Gemt kl. HH:MM:SS"-indikator.
- **Progressiv formular**: Basisfelter (Titel, Dato, System, Type, Emne, Resumé, Detaljer) synlige. Ekstra felter (Beslutning, Opfølgning, Frist, Kontakt, Organisation, Officielt link) skjult bag "Vis flere felter".
- **TipTap rig-tekst editor** på `detaljer`-feltet: Fed, kursiv, H2/H3, punktopstilling, nummereret liste, citat, kode, undo/redo. Markdown-genveje (`**fed**`, `- liste`, `## overskrift`).
- **Aktiv note-pill** i sidebar viser titel på aktiv kladde og genåbner den ved klik.
- **Ctrl+K globalt**: Åbner ny logbogspost fra alle sider.
- **"Kladde"-badge** synlig i logbogslisten (subtil amber styling) så man ikke glemmer draftposter.
- Backend: `LogEntryModel.draft: bool` felt tilføjet.

## Update (2026-02) — Lokal desktop-migration
Krav fra dansk offentlig styrelse: data må KUN gemmes lokalt på arbejds-PC.

### Phase 1: MongoDB → SQLite (færdig, verificeret 100%)
- **/app/backend/sqlite_adapter.py**: Motor-kompatibel wrapper (find/find_one/insert_one/update_one/delete_one/count_documents). Storage: én tabel per kollektion, rows = (id TEXT PK, data JSON). Understøtter equality queries og `$or`.
- **/app/backend/server.py**: kun linje 1-19 ændret (motor → sqlite_adapter). Alt andet uændret.
- **SQLITE_DB_PATH env-var**: brugerdefineret placering (default: ./data/systemforvalter.db). Auto-oprettes.
- Frontend 100% uændret.
- Git tags: `v1-cloud-mongodb` (rollback-punkt) og `v2-local-sqlite`.

### Phase 2: Lokal installation (færdig)
- **/app/README.md**: Fuld guide til Windows/macOS/Linux med Python 3.11+, Node 20+, yarn. SQLite-fil-placering (bruger vælger selv). Backup via kopi af `.db`-fil.

### Phase 3: Tauri desktop-app (skabelon)
- **/app/src-tauri/README.md**: Trinvis guide til at pakke som `.exe`/`.dmg`/`.deb` (~10 MB). PyInstaller til backend-binær, Tauri sidecar-config, `SQLITE_DB_PATH` per-OS (%APPDATA%, Application Support, .local/share).
- Faktisk Tauri-init skal køres lokalt (kræver Rust-toolchain, kan ikke gøres i Emergent-container).
