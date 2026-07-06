"use client";

import { useMutation } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

export default function SettingsClient() {
  const [key, setKey] = useState("maintenance_mode");
  const [value, setValue] = useState("false");

  const save = useMutation({
    mutationFn: async () => api.patch("/admin/settings", { key, value })
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">System Settings</h1>
      <p className="text-sm text-muted-foreground">Super Admin only. Secrets are encrypted at rest.</p>
      <Card>
        <CardHeader>
          <CardTitle>Update Setting</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input id="key" value={key} onChange={(e) => setKey(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input id="value" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving..." : "Save Setting"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
