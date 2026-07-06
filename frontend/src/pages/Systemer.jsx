import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, SYSTEM_STATUSES, KRITIKALITET } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { StatusBadge, KritikalitetBadge } from "../lib/badges";
import { Plus, ChevronRight } from "lucide-react";
import EntityDialog from "../components/EntityDialog";

export default function Systemer() {
  const navigate = useNavigate();
  const [systems, setSystems] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("__all__");
  const [critF, setCritF] = useState("__all__");
  const [openDialog, setOpenDialog] = useState(false);

  const refresh = () => {
    api.list("systems").then(setSystems);
    api.list("organizations").then(setOrgs);
  };
  useEffect(() => { refresh(); }, []);

  const orgMap = useMemo(() => Object.fromEntries(orgs.map(o => [o.id, o])), [orgs]);

  const filtered = systems.filter(s => {
    if (statusF !== "__all__" && s.status !== statusF) return false;
    if (critF !== "__all__" && s.kritikalitet !== critF) return false;
    if (q && !`${s.navn} ${s.systemejer} ${s.dataejer}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const fields = [
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
    { name: "beskrivelse", label: "Intern beskrivelse/notat", type: "textarea" },
  ];

  const handleCreate = async (values) => {
    await api.create("systems", { ...values, status: values.status || "Aktiv", kritikalitet: values.kritikalitet || "Middel" });
    toast.success("System oprettet");
    refresh();
  };

  return (
    <div className="space-y-6" data-testid="systemer-page">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">Systemer</h1>
          <p className="mt-2 text-slate-600">Overblik over dine fagsystemer.</p>
        </div>
        <Button onClick={() => setOpenDialog(true)} className="bg-blue-700 hover:bg-blue-800" data-testid="opret-system-btn">
          <Plus className="h-4 w-4 mr-2" /> Nyt system
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap items-center bg-white border border-slate-200 rounded-md p-4">
        <Input placeholder="Søg…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" data-testid="systemer-sog" />
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="max-w-xs" data-testid="systemer-filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Alle statusser</SelectItem>
            {SYSTEM_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={critF} onValueChange={setCritF}>
          <SelectTrigger className="max-w-xs" data-testid="systemer-filter-kritikalitet"><SelectValue placeholder="Kritikalitet" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Alle kritikaliteter</SelectItem>
            {KRITIKALITET.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Systemnavn</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kritikalitet</TableHead>
              <TableHead>Leverandør</TableHead>
              <TableHead>Driftsleverandør</TableHead>
              <TableHead>Systemejer</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Ingen systemer.</TableCell></TableRow>
            ) : filtered.map(s => (
              <TableRow
                key={s.id}
                className="hover:bg-blue-50/40 cursor-pointer"
                onClick={() => navigate(`/systemer/${s.id}`)}
                data-testid={`system-row-${s.id}`}
              >
                <TableCell>
                  <Link to={`/systemer/${s.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-slate-900 hover:text-blue-700">{s.navn}</Link>
                </TableCell>
                <TableCell><StatusBadge value={s.status} /></TableCell>
                <TableCell><KritikalitetBadge value={s.kritikalitet} /></TableCell>
                <TableCell className="text-slate-600">{orgMap[s.leverandor_id]?.navn || "—"}</TableCell>
                <TableCell className="text-slate-600">{orgMap[s.driftsleverandor_id]?.navn || "—"}</TableCell>
                <TableCell className="text-slate-600">{s.systemejer || "—"}</TableCell>
                <TableCell><ChevronRight className="h-4 w-4 text-slate-400" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EntityDialog open={openDialog} onOpenChange={setOpenDialog} title="Nyt system" fields={fields}
        initial={{ status: "Aktiv", kritikalitet: "Middel" }} onSubmit={handleCreate} testidPrefix="system-form" />
    </div>
  );
}
