import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import LogEntrySheet from "./LogEntrySheet";
import { api } from "../lib/api";

const LogEntryCtx = createContext(null);

export const useLogEntry = () => useContext(LogEntryCtx);

export function LogEntryProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [entryId, setEntryId] = useState(null);   // id of the entry currently being edited (null = brand new)
  const [initialSystemId, setInitialSystemId] = useState(null);
  const [refs, setRefs] = useState({ systems: [], contacts: [], orgs: [] });
  const [activeDraftTitle, setActiveDraftTitle] = useState(null); // last known title of active draft
  const [reloadCounter, setReloadCounter] = useState(0); // consumers subscribe to trigger refresh

  // load reference data lazily
  const ensureRefs = useCallback(async () => {
    if (refs.systems.length && refs.contacts.length && refs.orgs.length) return;
    const [systems, contacts, orgs] = await Promise.all([
      api.list("systems"), api.list("contacts"), api.list("organizations"),
    ]);
    setRefs({ systems, contacts, orgs });
  }, [refs]);

  // Preload reference data on mount so system pre-selection works instantly
  useEffect(() => { ensureRefs(); }, [ensureRefs]);

  const openNew = useCallback((systemId = null) => {
    ensureRefs();
    setEntryId(null);
    setInitialSystemId(systemId);
    setOpen(true);
  }, [ensureRefs]);

  const openExisting = useCallback((id) => {
    ensureRefs();
    setEntryId(id);
    setInitialSystemId(null);
    setOpen(true);
  }, [ensureRefs]);

  const reopenActiveDraft = useCallback(() => {
    if (entryId) { setOpen(true); }
  }, [entryId]);

  const clearActiveDraft = useCallback(() => {
    setEntryId(null);
    setActiveDraftTitle(null);
    setOpen(false);
  }, []);

  const bumpReload = useCallback(() => setReloadCounter((c) => c + 1), []);

  // Global Ctrl/Cmd + K shortcut → open new log entry
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openNew();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openNew]);

  return (
    <LogEntryCtx.Provider value={{
      openNew, openExisting, reopenActiveDraft, clearActiveDraft,
      activeEntryId: entryId, activeDraftTitle, reloadCounter, bumpReload,
    }}>
      {children}
      <LogEntrySheet
        open={open}
        onOpenChange={setOpen}
        entryId={entryId}
        setEntryId={setEntryId}
        initialSystemId={initialSystemId}
        refs={refs}
        onDraftTitleChange={setActiveDraftTitle}
        onSaved={bumpReload}
        onClearActive={() => { setEntryId(null); setActiveDraftTitle(null); }}
      />
    </LogEntryCtx.Provider>
  );
}
