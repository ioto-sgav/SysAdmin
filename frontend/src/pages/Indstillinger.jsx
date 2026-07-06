import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function Indstillinger() {
  return (
    <div className="space-y-6" data-testid="indstillinger-page">
      <header>
        <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">Indstillinger</h1>
        <p className="mt-2 text-slate-600">Om appen og dine data.</p>
      </header>

      <Card className="rounded-md">
        <CardHeader><CardTitle className="font-heading text-lg text-slate-800">Om appen</CardTitle></CardHeader>
        <CardContent className="p-6 pt-0 text-sm text-slate-700 space-y-3">
          <p>Denne app er et <strong>personligt arbejdsredskab</strong> til systemforvaltning. Den er ikke et officielt ESDH-, journaliserings- eller kontraktarkivsystem.</p>
          <p>Brug links til officielle placeringer (ServiceNow, ESDH, dokumentation) frem for at kopiere officielle referater eller dokumenter ind i appen.</p>
        </CardContent>
      </Card>

      <Card className="rounded-md border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-amber-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Følsomme oplysninger
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 text-sm text-amber-900">
          Undgå at anvende appen til følsomme personoplysninger, fortrolige oplysninger eller officielle dokumenter, der kræver journalisering.
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader><CardTitle className="font-heading text-lg text-slate-800">Kanban-kolonner</CardTitle></CardHeader>
        <CardContent className="p-6 pt-0 text-sm text-slate-600">
          Kolonner administreres direkte på <a href="/opgaver" className="text-blue-700 hover:underline">Opgaver</a>-siden.
        </CardContent>
      </Card>
    </div>
  );
}
