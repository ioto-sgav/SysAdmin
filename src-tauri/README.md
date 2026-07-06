# Tauri Desktop-app — Forberedelse

Denne mappe er forberedt til at pakke appen som en **rigtig desktop-app** (`.exe` / `.dmg` / `.deb`) via [Tauri](https://tauri.app). Slutresultat: ~10 MB installer med app-ikon i menuen.

## Arkitektur

```
┌─────────────────────────────────────────┐
│  Tauri window (native, Rust wrapper)    │
│  ┌───────────────────────────────────┐  │
│  │  React frontend (built static)    │  │
│  │  fetch → http://127.0.0.1:8001    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Sidecar: python.exe server.py          │
│  (embedded FastAPI + SQLite)            │
└─────────────────────────────────────────┘
```

## Forudsætninger

- Rust toolchain: https://www.rust-lang.org/tools/install
- Tauri CLI: `cargo install tauri-cli` eller `yarn add -D @tauri-apps/cli`
- Python embedded distribution til sidecar

## Trin til at færdiggøre pakning

### 1. Byg frontend statisk
```bash
cd frontend
yarn build   # → frontend/build/
```

### 2. Byg standalone Python-backend
Brug **PyInstaller** til at pakke `server.py` + `sqlite_adapter.py` + deps til én binær:
```bash
cd backend
pip install pyinstaller
pyinstaller --onefile --name systemforvalter-backend server.py
# → backend/dist/systemforvalter-backend(.exe)
```

### 3. Init Tauri
```bash
cd frontend
yarn tauri init
# Peg "distDir" til ../build og "devPath" til http://localhost:3000
```

### 4. Konfigurér sidecar i `src-tauri/tauri.conf.json`
```json
{
  "bundle": {
    "externalBin": ["binaries/systemforvalter-backend"]
  }
}
```
Kopiér Python-binæren til `src-tauri/binaries/`.

### 5. Start backend fra Rust ved app-start
I `src-tauri/src/main.rs`:
```rust
use tauri::api::process::{Command, CommandEvent};

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let (mut rx, mut _child) = Command::new_sidecar("systemforvalter-backend")
        .expect("failed to find backend binary")
        .spawn()
        .expect("failed to spawn backend");
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

### 6. Byg installer
```bash
yarn tauri build
# Windows → src-tauri/target/release/bundle/msi/*.msi
# macOS   → src-tauri/target/release/bundle/dmg/*.dmg
# Linux   → src-tauri/target/release/bundle/deb/*.deb
```

## Data-placering i desktop-app

Sæt `SQLITE_DB_PATH` via Tauri når backend startes:
- Windows: `%APPDATA%\systemforvalter\data.db`
- macOS: `~/Library/Application Support/systemforvalter/data.db`
- Linux: `~/.local/share/systemforvalter/data.db`

Eller lad brugeren vælge sti første gang via en Tauri-dialog.

## Status

Denne mappe indeholder KUN dokumentation. Den faktiske Tauri-init skal køres på en udviklings-PC med Rust-toolchain installeret — det kan ikke gøres inde i Emergent-container.

Foreslået næste skridt: eksportér koden til GitHub, klon lokalt, følg trinene ovenfor.
