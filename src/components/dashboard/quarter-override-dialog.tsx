"use client";

import type * as React from "react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { createClient } from "~/lib/supabase/client";
import type { Quarter } from "~/lib/supabase/types";

const AUTO_VALUE = "auto";

export function QuarterOverrideDialog({
  trigger,
  classId,
  currentOverride,
  onSaved,
}: {
  trigger: React.ReactNode;
  classId: string;
  currentOverride: Quarter | null;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(currentOverride ?? AUTO_VALUE);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setSubmitting(true);
    const supabase = createClient();
    await supabase
      .from("classes")
      .update({
        current_quarter_override: value === AUTO_VALUE ? null : value,
      })
      .eq("id", classId);
    setSubmitting(false);
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValue(currentOverride ?? AUTO_VALUE);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change current quarter</DialogTitle>
          <DialogDescription>
            Auto-detect uses today's date. Override it if this class is ahead of
            or behind the typical school-year schedule.
          </DialogDescription>
        </DialogHeader>
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AUTO_VALUE}>Auto-detect</SelectItem>
            <SelectItem value="Q1">Q1</SelectItem>
            <SelectItem value="Q2">Q2</SelectItem>
            <SelectItem value="Q3">Q3</SelectItem>
            <SelectItem value="Q4">Q4</SelectItem>
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
