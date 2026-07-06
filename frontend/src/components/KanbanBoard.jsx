import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, TASK_STATUS, TASK_PRIORITET } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus, X, Pencil, MoreVertical } from "lucide-react";
import { PrioritetBadge, TaskStatusBadge } from "../lib/badges";
import EntityDialog from "./EntityDialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from "./ui/dropdown-menu";

/**
 * Kanban board component.
 * If systemId is provided, board is scoped to that system.
 */
export default function KanbanBoard({ systemId = null, systems = [], onReload, systemFilter = null, openCreateSignal = 0 }) {
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newColName, setNewColName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [initialColumn, setInitialColumn] = useState("Todo");
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const load = () => {
    api.list("kanban_columns").then((c) => setColumns([...c].sort((a, b) => a.order - b.order)));
    if (systemId) {
      api.systemTasks(systemId).then(setTasks);
    } else {
      api.list("tasks").then(setTasks);
    }
  };
  useEffect(load, [systemId]);

  // Allow parent to trigger "new task" dialog
  useEffect(() => {
    if (openCreateSignal > 0) {
      setEditingTask(null);
      setInitialColumn(columns[0]?.navn || "Todo");
      setDialogOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCreateSignal]);

  const systemMap = useMemo(() => Object.fromEntries(systems.map(s => [s.id, s])), [systems]);

  // Apply optional system filter for non-scoped boards
  const visibleTasks = systemId
    ? tasks
    : (systemFilter === "__none__"
        ? tasks.filter(t => !t.system_id)
        : (systemFilter && systemFilter !== "__all__"
            ? tasks.filter(t => t.system_id === systemFilter)
            : tasks));

  const addColumn = async () => {
    const navn = newColName.trim();
    if (!navn) return;
    const maxOrder = columns.reduce((m, c) => Math.max(m, c.order), -1);
    await api.create("kanban_columns", { navn, order: maxOrder + 1 });
    setNewColName("");
    load();
  };

  const renameColumn = async (col) => {
    const nyt = window.prompt("Nyt navn til kolonne", col.navn);
    if (!nyt || nyt === col.navn) return;
    await api.update("kanban_columns", col.id, { navn: nyt });
    // Update tasks that reference the old column name
    const affected = tasks.filter(t => t.kanban_kolonne === col.navn);
    await Promise.all(affected.map(t => api.update("tasks", t.id, { ...t, kanban_kolonne: nyt })));
    load();
  };

  const deleteColumn = async (col) => {
    if (!window.confirm(`Slet kolonnen "${col.navn}"? Opgaver flyttes til Todo.`)) return;
    const affected = tasks.filter(t => t.kanban_kolonne === col.navn);
    await Promise.all(affected.map(t => api.update("tasks", t.id, { ...t, kanban_kolonne: "Todo" })));
    await api.remove("kanban_columns", col.id);
    load();
  };

  const onDragStart = (e, task) => {
    setDraggingId(task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e, colName) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== colName) setDragOverCol(colName);
  };

  const onDrop = async (e, colName) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggingId) return;
    const task = tasks.find(t => t.id === draggingId);
    if (!task || task.kanban_kolonne === colName) { setDraggingId(null); return; }
    const newStatus = colName.toLowerCase() === "done" ? "Færdig"
      : colName.toLowerCase() === "doing" ? "I gang"
      : task.status === "Færdig" ? "Ikke startet" : task.status;
    await api.update("tasks", task.id, { ...task, kanban_kolonne: colName, status: newStatus });
    setDraggingId(null);
    load();
  };

  const openCreate = (colName) => {
    setEditingTask(null);
    setInitialColumn(colName);
    setDialogOpen(true);
  };

  const openEdit = (t) => {
    setEditingTask(t);
    setDialogOpen(true);
  };

  const deleteTask = async (t) => {
    if (!window.confirm("Slet opgave?")) return;
    await api.remove("tasks", t.id);
    load();
  };

  const taskFields = [
    { name: "titel", label: "Titel", required: true },
    ...(systemId ? [] : [{ name: "system_id", label: "System", type: "select", allowEmpty: true, options: systems.map(s => ({ value: s.id, label: s.navn })) }]),
    { name: "kanban_kolonne", label: "Kolonne", type: "select", options: columns.map(c => c.navn) },
    { name: "status", label: "Status", type: "select", options: TASK_STATUS },
    { name: "prioritet", label: "Prioritet", type: "select", options: TASK_PRIORITET },
    { name: "deadline", label: "Deadline", type: "date" },
    { name: "afventer", label: "Afventer" },
    { name: "naeste_handling", label: "Næste handling" },
    { name: "noter", label: "Noter", type: "textarea" },
  ];

  const handleSubmit = async (values) => {
    const payload = { ...values };
    if (systemId) payload.system_id = systemId;
    if (editingTask) {
      await api.update("tasks", editingTask.id, payload);
      toast.success("Opgave opdateret");
    } else {
      await api.create("tasks", { ...payload, kanban_kolonne: payload.kanban_kolonne || initialColumn });
      toast.success("Opgave oprettet");
    }
    load();
    if (onReload) onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <Input placeholder="Ny kolonne…" value={newColName} onChange={(e) => setNewColName(e.target.value)}
               className="max-w-xs" data-testid="kanban-ny-kolonne" />
        <Button variant="outline" onClick={addColumn} data-testid="kanban-tilfoej-kolonne"><Plus className="h-4 w-4 mr-1" /> Tilføj kolonne</Button>
      </div>

      <div className="grid grid-flow-col auto-cols-[280px] gap-4 overflow-x-auto pb-4 items-stretch" data-testid="kanban-board">
        {columns.map(col => {
          const colTasks = visibleTasks.filter(t => t.kanban_kolonne === col.navn);
          const dragOver = dragOverCol === col.navn;
          return (
            <div
              key={col.id}
              className={`kanban-col bg-slate-100/70 rounded-md p-4 flex flex-col ${dragOver ? "drag-over" : ""}`}
              onDragOver={(e) => onDragOver(e, col.navn)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => onDrop(e, col.navn)}
              data-testid={`kanban-col-${col.navn}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-medium text-slate-800">{col.navn}</span>
                  <span className="text-xs text-slate-500">({colTasks.length})</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 text-slate-500 hover:text-slate-800" data-testid={`kanban-col-menu-${col.navn}`}><MoreVertical className="h-4 w-4" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => renameColumn(col)}>Omdøb kolonne</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteColumn(col)} className="text-red-600">Slet kolonne</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <button onClick={() => openCreate(col.navn)} className="w-full text-left text-xs text-slate-500 hover:text-blue-700 mb-3 flex items-center gap-1"
                      data-testid={`kanban-tilfoej-opgave-${col.navn}`}>
                <Plus className="h-3 w-3" /> Ny opgave
              </button>

              <div className="space-y-2">
                {colTasks.map(t => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, t)}
                    onDragEnd={() => setDraggingId(null)}
                    className={`kanban-card bg-white p-3 rounded border border-slate-200 shadow-sm cursor-grab ${draggingId === t.id ? "dragging" : ""}`}
                    data-testid={`task-card-${t.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium text-slate-900 flex-1">{t.titel}</div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(t)} className="text-slate-400 hover:text-blue-700"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteTask(t)} className="text-slate-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    {!systemId && t.system_id && (
                      <div className="mt-1 text-xs text-slate-500">{systemMap[t.system_id]?.navn}</div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                      <PrioritetBadge value={t.prioritet} />
                      <TaskStatusBadge value={t.status} />
                    </div>
                    {(t.deadline || t.afventer || t.naeste_handling) && (
                      <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                        {t.deadline && <div>Deadline: {t.deadline}</div>}
                        {t.afventer && <div>Afventer: {t.afventer}</div>}
                        {t.naeste_handling && <div>Næste: {t.naeste_handling}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <EntityDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingTask(null); }}
        title={editingTask ? "Redigér opgave" : "Ny opgave"}
        fields={taskFields}
        initial={editingTask || { kanban_kolonne: initialColumn, status: "Ikke startet", prioritet: "Normal" }}
        onSubmit={handleSubmit}
        testidPrefix="opgave-form"
      />
    </div>
  );
}
