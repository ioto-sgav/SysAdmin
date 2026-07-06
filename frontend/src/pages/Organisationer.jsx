import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, ORG_TYPES } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Plus, ExternalLink, Trash2, Pencil } from "lucide-react";
import EntityDialog from "../components/EntityDialog";

export default function Organisationer() {
  const [items, setItems] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [q, setQ] = useState("");
  const [typeF, setTypeF] = useState("__all__");
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => {
    api.list("organizations").then(setItems);
    api.list("contacts").then(setContacts);
  };
  useEffect(() => { refresh(); }, []);

  const contactMap = useMemo(() => Object.fromEntries(contacts.map(c => [c.id, c])), [contacts]);

  const filtered = items.filter(o => {
    if (typeF !== "__all__" && o.type !== typeF) return false;
    if (q && !`${o.navn} ${o.website}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const fields = [
    { name: "navn", label: "Navn", required: true },
    { name: "type", label: "Type", type: "select", options: ORG_TYPES },
    { name: "primaer_kontakt_id", label: "Primær kontakt", type: "select", allowEmpty: true, options: contacts.map(c => ({ value: c.id, label: c.navn })) },
    { name: "website", label: "Website", type: "url" },
    { name: "noter", label: "Noter", type: "textarea" },
  ];

  const handleSubmit = async (values) => {
    if (editing) {
      await api.update("organizations", editing.id, values);
      toast.success("Organisation opdateret");
    } else {
      await api.create("organizations", { ...values, type: values.type || "Ukendt/andet" });
      toast.success("Organisation oprettet");
    }
    setEditing(null);
    refresh();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Slet organisation?")) return;
    await api.remove("organizations", id);
    toast.success("Slettet");
    refresh();
  };

  return (
    <div className="space-y-6" data-testid="organisationer-page">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">Organisationer</h1>
          <p className="mt-2 text-slate-600">Leverandører, interne enheder og andre aktører.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpenDialog(true); }} className="bg-blue-700 hover:bg-blue-800" data-testid="opret-org-btn">
          <Plus className="h-4 w-4 mr-2" /> Ny organisation
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap items-center bg-white border border-slate-200 rounded-md p-4">
        <Input placeholder="Søg…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" data-testid="org-sog" />
        <Select value={typeF} onValueChange={setTypeF}>
          <SelectTrigger className="max-w-xs" data-testid="org-filter-type"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Alle typer</SelectItem>
            {ORG_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Navn</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Primær kontakt</TableHead>
              <TableHead>Website</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">Ingen organisationer.</TableCell></TableRow>
            ) : filtered.map(o => (
              <TableRow key={o.id} className="hover:bg-slate-50">
                <TableCell className="font-medium text-slate-900">{o.navn}</TableCell>
                <TableCell className="text-slate-600">{o.type}</TableCell>
                <TableCell className="text-slate-600">{contactMap[o.primaer_kontakt_id]?.navn || "—"}</TableCell>
                <TableCell>
                  {o.website ? <a href={o.website} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline inline-flex items-center gap-1">{o.website}<ExternalLink className="h-3 w-3" /></a> : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <button onClick={() => { setEditing(o); setOpenDialog(true); }} className="text-slate-500 hover:text-blue-700 p-1" data-testid={`edit-org-${o.id}`}><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(o.id)} className="text-slate-500 hover:text-red-600 p-1 ml-1" data-testid={`delete-org-${o.id}`}><Trash2 className="h-4 w-4" /></button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EntityDialog open={openDialog} onOpenChange={(v) => { setOpenDialog(v); if (!v) setEditing(null); }}
        title={editing ? "Redigér organisation" : "Ny organisation"} fields={fields}
        initial={editing || { type: "Ukendt/andet" }} onSubmit={handleSubmit} testidPrefix="org-form" />
    </div>
  );
}
