import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, LOG_TYPER, LOG_EMNER } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Plus, ExternalLink, ChevronDown, ChevronRight, Pencil, Trash2, Flag, FileEdit } from "lucide-react";
import { TypeBadge } from "../lib/badges";
import { useLogEntry } from "../components/LogEntryProvider";

export default function LogbogList({ scopeSystemId = null, embedded = false, systems = [], contacts = [], orgs = [], onReload }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [typeF, setTypeF] = useState("__all__");
  const [emneF, setEmneF] = useState("__all__");
  const [onlyOpf, setOnlyOpf] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [localSystems, setLocalSystems] = useState(systems);
  const [localContacts, setLocalContacts] = useState(contacts);
  const [localOrgs, setLocalOrgs] = useState(orgs);
  const logCtx = useLogEntry();

  const load = () => {
    if (scopeSystemId) {
      api.systemLog(scopeSystemId).then(setItems);
    } else {
      api.list("log_entries").then(setItems);
    }
    if (!embedded) {
      api.list("systems").then(setLocalSystems);
      api.list("contacts").then(setLocalContacts);
      api.list("organizations").then(setLocalOrgs);
    }
  };
  useEffect(load, [scopeSystemId, logCtx?.reloadCounter]);

  useEffect(() => {
    if (embedded) {
      setLocalSystems(systems);
      setLocalContacts(contacts);
      setLocalOrgs(orgs);
    }
  }, [systems, contacts, orgs, embedded]);

  const systemMap = useMemo(() => Object.fromEntries(localSystems.map(s => [s.id, s])), [localSystems]);
  const contactMap = useMemo(() => Object.fromEntries(localContacts.map(c => [c.id, c])), [localContacts]);
  const orgMap = useMemo(() => Object.fromEntries(localOrgs.map(o => [o.id, o])), [localOrgs]);

  const filtered = items
    .filter(l => {
      if (typeF !== "__all__" && l.type !== typeF) return false;
      if (emneF !== "__all__" && l.emne !== emneF) return false;
      if (onlyOpf && !l.opfoelgning && !l.opfoelgningsfrist) return false;
      if (q && !`${l.titel} ${l.resume}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (b.dato || "").localeCompare(a.dato || ""));

  const openNew = () => logCtx.openNew(scopeSystemId || null);
  const openEdit = (id) => logCtx.openExisting(id);

  const handleDelete = async (id) => {
    if (!window.confirm("Slet logbogspost?")) return;
    await api.remove("log_entries", id);
    load();
    if (onReload) onReload();
    toast.success("Slettet");
  };

  return (
    <div className="space-y-4">
      {!embedded && (
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">Logbog</h1>
            <p className="mt-2 text-slate-600">Møder, beslutninger, observationer og opfølgninger. Tip: tryk <kbd className="border border-slate-300 rounded px-1 text-xs">Ctrl+K</kbd> for hurtig note.</p>
          </div>
          <Button onClick={openNew} className="bg-blue-700 hover:bg-blue-800" data-testid="opret-log-btn">
            <Plus className="h-4 w-4 mr-2" /> Ny logbogspost
          </Button>
        </div>
      )}

      <div className={`flex gap-3 flex-wrap items-center bg-white border border-slate-200 rounded-md p-4`}>
        <Input placeholder="Søg…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" data-testid="log-sog" />
        <Select value={typeF} onValueChange={setTypeF}>
          <SelectTrigger className="max-w-[180px]" data-testid="log-filter-type"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Alle typer</SelectItem>
            {LOG_TYPER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={emneF} onValueChange={setEmneF}>
          <SelectTrigger className="max-w-[180px]" data-testid="log-filter-emne"><SelectValue placeholder="Emne" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Alle emner</SelectItem>
            {LOG_EMNER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <Checkbox checked={onlyOpf} onCheckedChange={setOnlyOpf} data-testid="log-filter-opfoelgning" />
          Kun med opfølgning
        </label>
        {embedded && (
          <Button variant="outline" size="sm" onClick={openNew} className="ml-auto" data-testid="opret-log-btn-embedded">
            <Plus className="h-4 w-4 mr-1" /> Ny post
          </Button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-md divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">Ingen logbogsposter.</div>
        ) : filtered.map(l => {
          const isOpen = !!expanded[l.id];
          const isDraft = !!l.draft;
          return (
            <div key={l.id} className={`p-4 ${isDraft ? "bg-amber-50/40" : ""}`} data-testid={`log-row-${l.id}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => setExpanded(e => ({ ...e, [l.id]: !isOpen }))} className="text-slate-400 hover:text-slate-800 mt-0.5">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500 tabular-nums">{l.dato}</span>
                    <TypeBadge value={l.type} />
                    <span className="text-xs text-slate-500">· {l.emne}</span>
                    {!scopeSystemId && l.system_id && <span className="text-xs text-slate-500">· {systemMap[l.system_id]?.navn}</span>}
                    {isDraft && (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 border border-amber-200 rounded px-1.5 py-0.5" data-testid="log-draft-badge">
                        <FileEdit className="h-3 w-3" /> Kladde
                      </span>
                    )}
                    {l.beslutning && <span className="inline-flex items-center gap-1 text-xs text-blue-700"><Flag className="h-3 w-3" /> Beslutning</span>}
                    {(l.opfoelgning || l.opfoelgningsfrist) && <span className="text-xs text-amber-700">· Opfølgning{l.opfoelgningsfrist ? ` (${l.opfoelgningsfrist})` : ""}</span>}
                    {l.officielt_link && <a href={l.officielt_link} target="_blank" rel="noreferrer" className="text-xs text-blue-700 inline-flex items-center gap-0.5 hover:underline"><ExternalLink className="h-3 w-3" /> Officielt link</a>}
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{l.titel || <span className="italic text-slate-400">Uden titel</span>}</div>
                  {l.resume && <div className="mt-1 text-sm text-slate-600 line-clamp-2">{l.resume}</div>}

                  {isOpen && (
                    <div className="mt-3 space-y-3 text-sm text-slate-700 bg-slate-50 rounded-md p-4">
                      {l.beslutning && <div><span className="font-medium text-slate-800">Beslutning:</span> {l.beslutning}</div>}
                      {l.opfoelgning && <div><span className="font-medium text-slate-800">Opfølgning:</span> {l.opfoelgning}</div>}
                      {l.opfoelgningsfrist && <div><span className="font-medium text-slate-800">Frist:</span> {l.opfoelgningsfrist}</div>}
                      {l.kontakt_id && contactMap[l.kontakt_id] && <div><span className="font-medium text-slate-800">Kontakt:</span> {contactMap[l.kontakt_id].navn}</div>}
                      {l.organization_id && orgMap[l.organization_id] && <div><span className="font-medium text-slate-800">Organisation:</span> {orgMap[l.organization_id].navn}</div>}
                      {l.detaljer && (
                        <div>
                          <div className="font-medium text-slate-800 mb-1">Detaljer:</div>
                          <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: l.detaljer }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(l.id)} className="text-slate-400 hover:text-blue-700 p-1" data-testid={`edit-log-${l.id}`}><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(l.id)} className="text-slate-400 hover:text-red-600 p-1" data-testid={`delete-log-${l.id}`}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
