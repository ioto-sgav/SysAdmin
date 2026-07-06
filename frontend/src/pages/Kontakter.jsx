import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, KONTAKTTYPER } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Plus, Mail, Phone, Trash2, Pencil } from "lucide-react";
import EntityDialog from "../components/EntityDialog";

export default function Kontakter() {
  const [items, setItems] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [q, setQ] = useState("");
  const [typeF, setTypeF] = useState("__all__");
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => {
    api.list("contacts").then(setItems);
    api.list("organizations").then(setOrgs);
  };
  useEffect(() => { refresh(); }, []);

  const orgMap = useMemo(() => Object.fromEntries(orgs.map(o => [o.id, o])), [orgs]);

  const filtered = items.filter(c => {
    if (typeF !== "__all__" && c.kontakttype !== typeF) return false;
    if (q && !`${c.navn} ${c.email} ${c.titel}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const fields = [
    { name: "navn", label: "Navn", required: true },
    { name: "organization_id", label: "Organisation", type: "select", allowEmpty: true, options: orgs.map(o => ({ value: o.id, label: o.navn })) },
    { name: "kontakttype", label: "Kontakttype", type: "select", options: KONTAKTTYPER },
    { name: "titel", label: "Titel/funktion" },
    { name: "email", label: "E-mail", type: "email" },
    { name: "telefon", label: "Telefon" },
    { name: "noter", label: "Noter", type: "textarea" },
  ];

  const handleSubmit = async (values) => {
    if (editing) {
      await api.update("contacts", editing.id, values);
      toast.success("Kontakt opdateret");
    } else {
      await api.create("contacts", { ...values, kontakttype: values.kontakttype || "Anden kontakt" });
      toast.success("Kontakt oprettet");
    }
    setEditing(null);
    refresh();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Slet kontakt?")) return;
    await api.remove("contacts", id);
    toast.success("Slettet");
    refresh();
  };

  return (
    <div className="space-y-6" data-testid="kontakter-page">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">Kontakter</h1>
          <p className="mt-2 text-slate-600">Personer relevante for systemforvaltningen.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpenDialog(true); }} className="bg-blue-700 hover:bg-blue-800" data-testid="opret-kontakt-btn">
          <Plus className="h-4 w-4 mr-2" /> Ny kontakt
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap items-center bg-white border border-slate-200 rounded-md p-4">
        <Input placeholder="Søg…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" data-testid="kontakt-sog" />
        <Select value={typeF} onValueChange={setTypeF}>
          <SelectTrigger className="max-w-xs" data-testid="kontakt-filter-type"><SelectValue placeholder="Kontakttype" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Alle typer</SelectItem>
            {KONTAKTTYPER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Navn</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Kontakttype</TableHead>
              <TableHead>Titel</TableHead>
              <TableHead>Kontakt</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Ingen kontakter.</TableCell></TableRow>
            ) : filtered.map(c => (
              <TableRow key={c.id} className="hover:bg-slate-50">
                <TableCell className="font-medium text-slate-900">{c.navn}</TableCell>
                <TableCell className="text-slate-600">{orgMap[c.organization_id]?.navn || "—"}</TableCell>
                <TableCell className="text-slate-600">{c.kontakttype}</TableCell>
                <TableCell className="text-slate-600">{c.titel || "—"}</TableCell>
                <TableCell className="text-slate-600">
                  <div className="flex flex-col gap-1 text-xs">
                    {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-blue-700 hover:underline"><Mail className="h-3 w-3" />{c.email}</a>}
                    {c.telefon && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefon}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <button onClick={() => { setEditing(c); setOpenDialog(true); }} className="text-slate-500 hover:text-blue-700 p-1" data-testid={`edit-kontakt-${c.id}`}><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-slate-500 hover:text-red-600 p-1 ml-1" data-testid={`delete-kontakt-${c.id}`}><Trash2 className="h-4 w-4" /></button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EntityDialog open={openDialog} onOpenChange={(v) => { setOpenDialog(v); if (!v) setEditing(null); }}
        title={editing ? "Redigér kontakt" : "Ny kontakt"} fields={fields}
        initial={editing || { kontakttype: "Anden kontakt" }} onSubmit={handleSubmit} testidPrefix="kontakt-form" />
    </div>
  );
}
