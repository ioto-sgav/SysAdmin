import React from "react";

const cls = "inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium border whitespace-nowrap";

export function KritikalitetBadge({ value }) {
  const map = {
    "Lav": "bg-slate-100 text-slate-700 border-slate-200",
    "Middel": "bg-blue-100 text-blue-800 border-blue-200",
    "Høj": "bg-amber-100 text-amber-800 border-amber-200",
    "Kritisk": "bg-red-100 text-red-800 border-red-200",
  };
  return <span className={`${cls} ${map[value] || map.Middel}`} data-testid={`kritikalitet-badge-${value}`}>{value}</span>;
}

export function StatusBadge({ value }) {
  const map = {
    "Aktiv": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Under udfasning": "bg-amber-100 text-amber-800 border-amber-200",
    "Lukket": "bg-slate-200 text-slate-700 border-slate-300",
    "På vej ind": "bg-blue-100 text-blue-800 border-blue-200",
    "Historisk": "bg-slate-200 text-slate-700 border-slate-300",
    "Usikker": "bg-amber-100 text-amber-800 border-amber-200",
  };
  return <span className={`${cls} ${map[value] || "bg-slate-100 text-slate-700 border-slate-200"}`}>{value}</span>;
}

export function TaskStatusBadge({ value }) {
  const map = {
    "Ikke startet": "bg-slate-100 text-slate-700 border-slate-200",
    "I gang": "bg-blue-100 text-blue-800 border-blue-200",
    "Afventer": "bg-amber-100 text-amber-800 border-amber-200",
    "Færdig": "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return <span className={`${cls} ${map[value] || map["Ikke startet"]}`}>{value}</span>;
}

export function PrioritetBadge({ value }) {
  const map = {
    "Lav": "bg-slate-100 text-slate-700 border-slate-200",
    "Normal": "bg-blue-100 text-blue-800 border-blue-200",
    "Høj": "bg-amber-100 text-amber-800 border-amber-200",
    "Kritisk": "bg-red-100 text-red-800 border-red-200",
  };
  return <span className={`${cls} ${map[value] || map.Normal}`}>{value}</span>;
}

export function TypeBadge({ value }) {
  return <span className={`${cls} bg-slate-100 text-slate-700 border-slate-200`}>{value}</span>;
}
