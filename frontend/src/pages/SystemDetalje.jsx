import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { api, SYSTEM_STATUSES, KRITIKALITET, KONTAKTTYPER, ROLLER, SC_STATUS } from "../lib/api";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../components/ui/accordion";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ArrowLeft, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { StatusBadge, KritikalitetBadge } from "../lib/badges";
import EntityDialog from "../components/EntityDialog";
import KanbanBoard from "../components/KanbanBoard";
import LogbogList from "./LogbogList";

function StamData({ system, org, driftOrg, onEdit }) {
  const rows = [
    ["Status", <StatusBadge value={system.status} />],
    ["Kritikalitet", <KritikalitetBadge value={system.kritikalitet} />],
    ["Leverandør", org?.navn || "—"],
    ["Driftsleverandør", driftOrg?.navn || "—"],
    ["Driftsmodel", system.driftsmodel || "—"],
    ["Systemejer", system.systemejer || "—"],
    ["Dataejer", system.dataejer || "—"],
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center gap-3 text-sm">
            <div className="w-40 text-xs uppercase tracking-wider text-slate-500 font-medium">{k}</div>
            <div className="text-slate-800">{v}</div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">Links</div>
        <div className="space-y-1.5">
          {system.servicenow_link && <a href={system.servicenow_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-700 hover:underline"><ExternalLink className="h-3.5 w-3.5" /> ServiceNow</a>}
          {system.dokumentation_link && <a href={system.dokumentation_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-700 hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Dokumentation</a>}
          {system.aftaler_link && <a href={system.aftaler_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-700 hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Aftaler</a>}
          {!system.servicenow_link && !system.dokumentation_link && !system.aftaler_link && (
            <div className="text-sm text-slate-500">Ingen links tilføjet.</div>
          )}
        </div>
        {system.beskrivelse && (
          <div className="pt-3 border-t border-slate-200">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-1">Intern beskrivelse</div>
            <div className="text-sm text-slate-700 whitespace-pre-line">{system.beskrivelse}</div>
          </div>
        )}
        <div>
          <Button variant="outline" size="sm" onClick={onEdit} data-testid="rediger-system-btn"><Pencil className="h-3.5 w-3.5 mr-1" /> Redigér stamdata</Button>
        </div>
      </div>
    </div>
  );
}

function KontakterSektion({ systemId, contacts, orgs, onReload }) {
  const [rels, setRels] = useState([]);
  const [kategoriF, setKategoriF] = useState("__all__");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => api.systemContacts(systemId).then(setRels);
  useEffect(load, [systemId]);

  const filtered = rels.filter(r => kategoriF === "__all__" || r.kategori === kategoriF);

  const fields = [
    { name: "contact_id", label: "Kontakt", type: "select", required: true, options: contacts.map(c => ({ value: c.id, label: c.navn })) },
    { name: "kategori", label: "Kategori", type: "select", options: KONTAKTTYPER },
    { name: "rolle", label: "Rolle/funktion", type: "select", options: ROLLER },
    { name: "status", label: "Status", type: "select", options: SC_STATUS },
    { name: "ansvar", label: "Ansvar/beskrivelse", type: "textarea" },
  ];

  const handleSubmit = async (values) => {
    if (editing) {
      await api.update("system_contacts", editing.id, { ...values, system_id: systemId });
      toast.success("Relation opdateret");
    } else {
      await api.create("system_contacts", { ...values, system_id: systemId, kategori: values.kategori || "Anden kontakt", rolle: values.rolle || "Andet", status: values.status || "Aktiv" });
      toast.success("Kontakt knyttet til systemet");
    }
    setEditing(null);
    load();
    if (onReload) onReload();
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Fjern kontakten fra systemet?")) return;
    await api.remove("system_contacts", id);
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3 items-center flex-wrap">
        <Select value={kategoriF} onValueChange={setKategoriF}>
          <SelectTrigger className="max-w-[220px]" data-testid="sc-filter-kategori"><SelectValue placeholder="Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Alle kategorier</SelectItem>
            {KONTAKTTYPER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }} className="ml-auto bg-blue-700 hover:bg-blue-800" data-testid="tilfoej-systemkontakt-btn">
          <Plus className="h-4 w-4 mr-1" /> Tilføj kontakt
        </Button>
      </div>

      <div className="border border-slate-200 rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Navn</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Rolle/funktion</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ansvar</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-6 text-slate-500">Ingen kontakter tilknyttet endnu.</TableCell></TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id} className="hover:bg-slate-50" data-testid={`sc-row-${r.id}`}>
                <TableCell className="font-medium text-slate-900">{r.contact?.navn || "—"}</TableCell>
                <TableCell className="text-slate-600">{r.organization?.navn || "—"}</TableCell>
                <TableCell className="text-slate-600">{r.kategori}</TableCell>
                <TableCell className="text-slate-600">{r.rolle}</TableCell>
                <TableCell><StatusBadge value={r.status} /></TableCell>
                <TableCell className="text-slate-600 max-w-[240px] truncate" title={r.ansvar}>{r.ansvar || "—"}</TableCell>
                <TableCell className="text-slate-600">{r.contact?.email ? <a href={`mailto:${r.contact.email}`} className="text-blue-700 hover:underline">{r.contact.email}</a> : "—"}</TableCell>
                <TableCell className="text-right">
                  <button onClick={() => { setEditing(r); setDialogOpen(true); }} className="text-slate-400 hover:text-blue-700 p-1" data-testid={`edit-sc-${r.id}`}><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleRemove(r.id)} className="text-slate-400 hover:text-red-600 p-1" data-testid={`remove-sc-${r.id}`}><Trash2 className="h-4 w-4" /></button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EntityDialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null); }}
        title={editing ? "Redigér relation" : "Tilføj kontakt til systemet"} fields={fields}
        initial={editing ? { contact_id: editing.contact_id, kategori: editing.kategori, rolle: editing.rolle, status: editing.status, ansvar: editing.ansvar } : { kategori: "Leverandørkontakt", rolle: "Teknisk kontakt", status: "Aktiv" }}
        onSubmit={handleSubmit} testidPrefix="sc-form" />
    </div>
  );
}

export default function SystemDetalje() {
  const { id } = useParams();
  const [system, setSystem] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [systems, setSystems] = useState([]);
  const [editDialog, setEditDialog] = useState(false);

  const load = () => {
    api.get("systems", id).then(setSystem);
    api.list("organizations").then(setOrgs);
    api.list("contacts").then(setContacts);
    api.list("systems").then(setSystems);
  };
  useEffect(load, [id]);

  const orgMap = useMemo(() => Object.fromEntries(orgs.map(o => [o.id, o])), [orgs]);

  if (!system) return <div className="text-slate-500">Indlæser…</div>;

  const editFields = [
    { name: "navn", label: "Systemnavn", required: true },
    { name: "status", label: "Status", type: "select", options: SYSTEM_STATUSES },
    { name: "kritikalitet", label: "Kritikalitet", type: "select", options: KRITIKALITET },
    { name: "leverandor_id", label: "Leverandør", type: "select", allowEmpty: true, options: orgs.map(o => ({ value: o.id, label: o.navn })) },
    { name: "driftsleverandor_id", label: "Driftsleverandør", type: "select", allowEmpty: true, options: orgs.map(o => ({ value: o.id, label: o.navn })) },
    { name: "driftsmodel", label: "Driftsmodel" },
    { name: "systemejer", label: "Systemejer" },
    { name: "dataejer", label: "Dataejer" },
    { name: "servicenow_link", label: "ServiceNow-link", type: "url" },
    { name: "dokumentation_link", label: "Dokumentationslink", type: "url" },
    { name: "aftaler_link", label: "Aftaler-link", type: "url" },
    { name: "beskrivelse", label: "Intern beskrivelse", type: "textarea" },
  ];

  const handleUpdate = async (values) => {
    await api.update("systems", id, values);
    toast.success("System opdateret");
    load();
  };

  return (
    <div className="space-y-6" data-testid="system-detalje-page">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/systemer" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"><ArrowLeft className="h-3.5 w-3.5" /> Alle systemer</Link>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900" data-testid="system-titel">{system.navn}</h1>
          <div className="mt-2 flex gap-2 flex-wrap">
            <StatusBadge value={system.status} />
            <KritikalitetBadge value={system.kritikalitet} />
          </div>
        </div>
      </div>

      <Card className="rounded-md">
        <CardContent className="p-0">
          <Accordion type="multiple" defaultValue={["overblik", "kontakter", "opgaver", "logbog"]} className="w-full">
            <AccordionItem value="overblik">
              <AccordionTrigger className="px-6 hover:no-underline">
                <span className="font-heading text-lg font-medium text-slate-800">Systemoverblik og stamdata</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <StamData system={system} org={orgMap[system.leverandor_id]} driftOrg={orgMap[system.driftsleverandor_id]} onEdit={() => setEditDialog(true)} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="kontakter">
              <AccordionTrigger className="px-6 hover:no-underline">
                <span className="font-heading text-lg font-medium text-slate-800">Kontakter på systemet</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <KontakterSektion systemId={id} contacts={contacts} orgs={orgs} onReload={load} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="opgaver">
              <AccordionTrigger className="px-6 hover:no-underline">
                <span className="font-heading text-lg font-medium text-slate-800">Opgaver</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <KanbanBoard systemId={id} systems={systems} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="logbog">
              <AccordionTrigger className="px-6 hover:no-underline">
                <span className="font-heading text-lg font-medium text-slate-800">Logbog</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <LogbogList scopeSystemId={id} embedded systems={systems} contacts={contacts} orgs={orgs} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <EntityDialog open={editDialog} onOpenChange={setEditDialog} title="Redigér system" fields={editFields}
        initial={system} onSubmit={handleUpdate} testidPrefix="system-edit-form" />
    </div>
  );
}
