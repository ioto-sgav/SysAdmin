import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { KritikalitetBadge, PrioritetBadge, TypeBadge } from "../lib/badges";
import { AlertTriangle, Clock, Server, ListTodo, PauseCircle } from "lucide-react";

function KpiCard({ label, value, icon: Icon, testid, tone = "slate" }) {
  const tones = {
    slate: "text-slate-500",
    red: "text-red-500",
    amber: "text-amber-500",
    blue: "text-blue-600",
  };
  return (
    <Card className="rounded-md" data-testid={testid}>
      <CardContent className="p-6 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">{label}</div>
          <Icon className={`h-4 w-4 ${tones[tone]}`} />
        </div>
        <div className="font-heading text-3xl font-semibold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.dashboard().then(setData);
  }, []);

  if (!data) return <div className="text-slate-500">Indlæser…</div>;

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <header>
        <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">Dagligt overblik – hvad kræver din opmærksomhed?</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Åbne opgaver" value={data.antal_aabne_opgaver} icon={ListTodo} testid="kpi-aabne" tone="blue" />
        <KpiCard label="Afventer andre" value={data.antal_afventer} icon={PauseCircle} testid="kpi-afventer" tone="amber" />
        <KpiCard label="Forsinkede opgaver" value={data.antal_forsinkede} icon={AlertTriangle} testid="kpi-forsinkede" tone="red" />
        <KpiCard label="Systemer" value={data.antal_systemer} icon={Server} testid="kpi-systemer" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-md">
          <CardHeader><CardTitle className="font-heading text-lg text-slate-800">Kommende opfølgninger</CardTitle></CardHeader>
          <CardContent className="p-6 pt-0">
            {data.kommende_opfoelgninger.length === 0 ? (
              <div className="text-sm text-slate-500">Ingen kommende opfølgninger.</div>
            ) : (
              <ul className="divide-y divide-slate-100" data-testid="kommende-opfoelgninger">
                {data.kommende_opfoelgninger.map((l) => (
                  <li key={l.id} className="py-3 flex items-center gap-3">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">{l.titel}</div>
                      <div className="text-xs text-slate-500">{l.opfoelgning || l.resume}</div>
                    </div>
                    <div className="text-xs text-slate-600 whitespace-nowrap">{l.opfoelgningsfrist}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader><CardTitle className="font-heading text-lg text-slate-800">Vigtige opgaver</CardTitle></CardHeader>
          <CardContent className="p-6 pt-0">
            {data.vigtige_opgaver.length === 0 ? (
              <div className="text-sm text-slate-500">Ingen vigtige opgaver.</div>
            ) : (
              <ul className="divide-y divide-slate-100" data-testid="vigtige-opgaver">
                {data.vigtige_opgaver.map((t) => (
                  <li key={t.id} className="py-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">{t.titel}</div>
                      <div className="text-xs text-slate-500">{t.deadline ? `Deadline: ${t.deadline}` : (t.afventer ? `Afventer ${t.afventer}` : "")}</div>
                    </div>
                    <PrioritetBadge value={t.prioritet} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader><CardTitle className="font-heading text-lg text-slate-800">Kritiske systemer</CardTitle></CardHeader>
          <CardContent className="p-6 pt-0">
            {data.kritiske_systemer.length === 0 ? (
              <div className="text-sm text-slate-500">Ingen systemer med høj kritikalitet.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.kritiske_systemer.map((s) => (
                  <li key={s.id} className="py-3 flex items-center gap-3">
                    <Link to={`/systemer/${s.id}`} className="flex-1 text-sm font-medium text-slate-900 hover:text-blue-700">{s.navn}</Link>
                    <KritikalitetBadge value={s.kritikalitet} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader><CardTitle className="font-heading text-lg text-slate-800">Seneste logbogsposter</CardTitle></CardHeader>
          <CardContent className="p-6 pt-0">
            {data.seneste_log.length === 0 ? (
              <div className="text-sm text-slate-500">Ingen logbogsposter endnu.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.seneste_log.map((l) => (
                  <li key={l.id} className="py-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">{l.titel}</div>
                      <div className="text-xs text-slate-500">{l.dato} · {l.emne}</div>
                    </div>
                    <TypeBadge value={l.type} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
