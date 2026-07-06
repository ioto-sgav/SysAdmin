import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import KanbanBoard from "../components/KanbanBoard";

export default function Opgaver() {
  const [systems, setSystems] = useState([]);
  useEffect(() => { api.list("systems").then(setSystems); }, []);

  return (
    <div className="space-y-6" data-testid="opgaver-page">
      <header>
        <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">Opgaver</h1>
        <p className="mt-2 text-slate-600">Kanban på tværs af alle systemer. Træk kort mellem kolonner for at ændre status.</p>
      </header>
      <KanbanBoard systems={systems} />
    </div>
  );
}
