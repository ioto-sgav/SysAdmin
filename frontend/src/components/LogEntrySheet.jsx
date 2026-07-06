import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import RichTextEditor from "./RichTextEditor";
import { api, LOG_TYPER, LOG_EMNER } from "../lib/api";
import { CheckCircle2, Loader2, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY = { titel: "", dato: today(), system_id: "", type: "Andet", emne: "Andet",
  resume: "", beslutning: "", opfoelgning: "", opfoelgningsfrist: "", kontakt_id: "",
  organization_id: "", officielt_link: "", detaljer: "", draft: true };

export default function LogEntrySheet({ open, onOpenChange, entryId, setEntryId, initialSystemId, refs, onDraftTitleChange, onSaved, onClearActive }) {
  const [values, setValues] = useState(EMPTY);
  const [showMore, setShowMore] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const saveTimer = useRef(null);
  const currentIdRef = useRef(entryId);
  const dirtyRef = useRef(false);

  // Load existing entry when opened / entryId changes
  useEffect(() => {
    if (!open) return;
    currentIdRef.current = entryId;
    if (entryId) {
      api.get("log_entries", entryId).then((doc) => {
        setValues({ ...EMPTY, ...doc, system_id: doc.system_id || "", kontakt_id: doc.kontakt_id || "", organization_id: doc.organization_id || "" });
        setShowMore(!!(doc.beslutning || doc.opfoelgning || doc.opfoelgningsfrist || doc.kontakt_id || doc.organization_id || doc.officielt_link));
      });
    } else {
      setValues({ ...EMPTY, system_id: initialSystemId || "" });
      setShowMore(false);
    }
    setSaveState("idle");
    setLastSavedAt(null);
    dirtyRef.current = false;
  }, [open, entryId, initialSystemId]);

  const setField = (name, v) => {
    setValues((prev) => ({ ...prev, [name]: v }));
    dirtyRef.current = true;
  };

  // Debounced auto-save
  useEffect(() => {
    if (!open) return;
    if (!dirtyRef.current) return;
    // Require at least a title to persist
    if (!values.titel || values.titel.trim() === "") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        const payload = { ...values };
        // Normalise empty selects to null on server side (they are Optional)
        ["system_id", "kontakt_id", "organization_id"].forEach((k) => { if (!payload[k]) payload[k] = null; });
        if (!payload.opfoelgningsfrist) payload.opfoelgningsfrist = null;
        if (!payload.dato) payload.dato = today();

        if (currentIdRef.current) {
          await api.update("log_entries", currentIdRef.current, payload);
        } else {
          const created = await api.create("log_entries", payload);
          currentIdRef.current = created.id;
          setEntryId(created.id);
        }
        setSaveState("saved");
        setLastSavedAt(new Date());
        onDraftTitleChange?.(payload.draft ? values.titel : null);
        onSaved?.();
        dirtyRef.current = false;
      } catch (e) {
        setSaveState("idle");
        console.error(e);
      }
    }, 1200);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, open]);

  const finalize = async () => {
    if (!values.titel || values.titel.trim() === "") {
      toast.error("Titel er påkrævet før du kan færdiggøre");
      return;
    }
    const payload = { ...values, draft: false };
    ["system_id", "kontakt_id", "organization_id"].forEach((k) => { if (!payload[k]) payload[k] = null; });
    if (!payload.opfoelgningsfrist) payload.opfoelgningsfrist = null;
    if (currentIdRef.current) {
      await api.update("log_entries", currentIdRef.current, payload);
    } else {
      const created = await api.create("log_entries", payload);
      currentIdRef.current = created.id;
    }
    toast.success("Logbogspost gemt");
    onDraftTitleChange?.(null);
    onClearActive?.();
    onSaved?.();
    onOpenChange(false);
  };

  const discardDraft = async () => {
    if (!currentIdRef.current) { onClearActive?.(); onOpenChange(false); return; }
    if (!window.confirm("Fortryd og slet kladde?")) return;
    await api.remove("log_entries", currentIdRef.current);
    toast.success("Kladde annulleret");
    onClearActive?.();
    onSaved?.();
    onOpenChange(false);
  };

  const closeMinimize = () => {
    // Just closes; draft remains as-is
    if (values.draft) onDraftTitleChange?.(values.titel || "Uden titel");
    onOpenChange(false);
  };

  const savedLabel = useMemo(() => {
    if (saveState === "saving") return "Gemmer…";
    if (saveState === "saved" && lastSavedAt) return `Gemt kl. ${lastSavedAt.toLocaleTimeString("da-DK")}`;
    return values.titel ? "Skriver kladde" : "Skriv en titel for at starte kladde";
  }, [saveState, lastSavedAt, values.titel]);

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) closeMinimize(); else onOpenChange(true); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[720px] md:w-[55vw] md:max-w-[55vw] overflow-y-auto p-0 rounded-none"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        data-testid="log-sheet"
      >
        <SheetHeader className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-heading text-lg">{currentIdRef.current ? "Logbogspost" : "Ny logbogspost"}</SheetTitle>
            <div className="flex items-center gap-2 text-xs text-slate-500" data-testid="autosave-status">
              {saveState === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                saveState === "saved" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : null}
              <span>{savedLabel}</span>
            </div>
          </div>
        </SheetHeader>

        <div className="px-6 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Titel <span className="text-red-500">*</span></Label>
            <Input data-testid="log-sheet-titel" value={values.titel} onChange={(e) => setField("titel", e.target.value)} placeholder="Fx: Statusmøde med KMD" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Dato</Label>
              <Input type="date" data-testid="log-sheet-dato" value={values.dato || ""} onChange={(e) => setField("dato", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>System</Label>
              <Select value={values.system_id || "__none__"} onValueChange={(v) => setField("system_id", v === "__none__" ? "" : v)}>
                <SelectTrigger data-testid="log-sheet-system"><SelectValue placeholder="Vælg system…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Ingen —</SelectItem>
                  {refs.systems.map(s => <SelectItem key={s.id} value={s.id}>{s.navn}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={values.type} onValueChange={(v) => setField("type", v)}>
                <SelectTrigger data-testid="log-sheet-type"><SelectValue /></SelectTrigger>
                <SelectContent>{LOG_TYPER.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Emne</Label>
              <Select value={values.emne} onValueChange={(v) => setField("emne", v)}>
                <SelectTrigger data-testid="log-sheet-emne"><SelectValue /></SelectTrigger>
                <SelectContent>{LOG_EMNER.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Kort resumé</Label>
            <Textarea rows={2} data-testid="log-sheet-resume" value={values.resume || ""} onChange={(e) => setField("resume", e.target.value)} placeholder="Én-to sætninger til overblik" />
          </div>

          <div className="space-y-1.5">
            <Label>Detaljer / mødenoter</Label>
            <RichTextEditor value={values.detaljer || ""} onChange={(html) => setField("detaljer", html)} testid="log-sheet-detaljer" placeholder="Skriv dine mødenoter her…" />
          </div>

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-800"
            data-testid="log-sheet-toggle-mere"
          >
            {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showMore ? "Skjul ekstra felter" : "Vis flere felter (beslutning, opfølgning, link, relationer)"}
          </button>

          {showMore && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <div className="space-y-1.5">
                <Label>Beslutning</Label>
                <Textarea rows={2} data-testid="log-sheet-beslutning" value={values.beslutning || ""} onChange={(e) => setField("beslutning", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Opfølgning</Label>
                  <Textarea rows={2} data-testid="log-sheet-opfoelgning" value={values.opfoelgning || ""} onChange={(e) => setField("opfoelgning", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Opfølgningsfrist</Label>
                  <Input type="date" data-testid="log-sheet-opfoelgningsfrist" value={values.opfoelgningsfrist || ""} onChange={(e) => setField("opfoelgningsfrist", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Relateret kontakt</Label>
                  <Select value={values.kontakt_id || "__none__"} onValueChange={(v) => setField("kontakt_id", v === "__none__" ? "" : v)}>
                    <SelectTrigger data-testid="log-sheet-kontakt"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Ingen —</SelectItem>
                      {refs.contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.navn}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Relateret organisation</Label>
                  <Select value={values.organization_id || "__none__"} onValueChange={(v) => setField("organization_id", v === "__none__" ? "" : v)}>
                    <SelectTrigger data-testid="log-sheet-org"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Ingen —</SelectItem>
                      {refs.orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.navn}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Officielt link/referat</Label>
                <Input type="url" data-testid="log-sheet-link" value={values.officielt_link || ""} onChange={(e) => setField("officielt_link", e.target.value)} placeholder="https://esdh.example.dk/sag/…" />
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center gap-2">
          <Button variant="ghost" onClick={discardDraft} className="text-red-600 hover:text-red-700 hover:bg-red-50" data-testid="log-sheet-annuller">
            <Trash2 className="h-4 w-4 mr-1" /> Annullér
          </Button>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={closeMinimize} data-testid="log-sheet-minimize">Minimer</Button>
            <Button onClick={finalize} className="bg-blue-700 hover:bg-blue-800" data-testid="log-sheet-finalize">Færdiggør</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
