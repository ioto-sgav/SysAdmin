import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

/**
 * Generic entity form dialog.
 * fields: [{ name, label, type: text|textarea|select|url|date|email, options? }]
 */
export default function EntityDialog({ open, onOpenChange, title, fields, initial = {}, onSubmit, submitLabel = "Gem", testidPrefix = "form" }) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => { setValues(initial); }, [initial, open]);

  const setField = (name, v) => setValues((prev) => ({ ...prev, [name]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-md" data-testid={`${testidPrefix}-dialog`}>
        <DialogHeader><DialogTitle className="font-heading">{title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={`${testidPrefix}-${f.name}`}>{f.label}{f.required && <span className="text-red-500"> *</span>}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={`${testidPrefix}-${f.name}`}
                  data-testid={`${testidPrefix}-${f.name}`}
                  value={values[f.name] || ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                  rows={f.rows || 3}
                />
              ) : f.type === "select" ? (
                <Select value={values[f.name] || ""} onValueChange={(v) => setField(f.name, v === "__none__" ? "" : v)}>
                  <SelectTrigger data-testid={`${testidPrefix}-${f.name}`}><SelectValue placeholder="Vælg…" /></SelectTrigger>
                  <SelectContent>
                    {f.allowEmpty && <SelectItem value="__none__">— Ingen —</SelectItem>}
                    {(f.options || []).map((o) => (
                      <SelectItem key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
                        {typeof o === "string" ? o : o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`${testidPrefix}-${f.name}`}
                  data-testid={`${testidPrefix}-${f.name}`}
                  type={f.type || "text"}
                  value={values[f.name] || ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                  required={f.required}
                />
              )}
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid={`${testidPrefix}-cancel`}>Annullér</Button>
            <Button type="submit" disabled={saving} className="bg-blue-700 hover:bg-blue-800" data-testid={`${testidPrefix}-submit`}>{saving ? "Gemmer…" : submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
