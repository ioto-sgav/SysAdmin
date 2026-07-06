import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import KanbanBoard from "../components/KanbanBoard";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus } from "lucide-react";

export default function Opgaver() {
  const [systems, setSystems] = useState([]);
  const [systemFilter, setSystemFilter] = useState("__all__");
  const [openCreateSignal, setOpenCreateSignal] = useState(0);

  useEffect(() => { api.list("systems").then(setSystems); }, []);

  return (
    <div className="space-y-6" data-testid="opgaver-page">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">Opgaver</h1>
          <p className="mt-2 text-slate-600">Kanban på tværs af alle systemer. Træk kort mellem kolonner for at ændre status.</p>
        </div>
        <Button onClick={() => setOpenCreateSignal(n => n + 1)} className="bg-blue-700 hover:bg-blue-800" data-testid="opret-opgave-btn">
          <Plus className="h-4 w-4 mr-2" /> Ny opgave
        </Button>
      </div>

      <div className="flex gap-3 items-center bg-white border border-slate-200 rounded-md p-4">
        <span className="text-sm text-slate-600">Filtrér på system:</span>
        <Select value={systemFilter} onValueChange={setSystemFilter}>
          <SelectTrigger className="max-w-xs" data-testid="opgaver-filter-system"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Alle systemer</SelectItem>
            <SelectItem value="__none__">— Uden system —</SelectItem>
            {systems.map(s => <SelectItem key={s.id} value={s.id}>{s.navn}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <KanbanBoard systems={systems} systemFilter={systemFilter === "__none__" ? "__none__" : systemFilter} openCreateSignal={openCreateSignal} />
    </div>
  );
}
