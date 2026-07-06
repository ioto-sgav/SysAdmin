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
