"use client";

import type * as React from "react";
import { useState } from "react";
import { ClassForm } from "~/components/dashboard/class-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

export function CreateClassDialog({
  trigger,
  onCreated,
}: {
  trigger: React.ReactNode;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setFormKey((k) => k + 1);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New class</DialogTitle>
          <DialogDescription>
            Set up how this class is graded — you can add assignments right
            after.
          </DialogDescription>
        </DialogHeader>
        <ClassForm
          key={formKey}
          onCreated={() => {
            setOpen(false);
            setFormKey((k) => k + 1);
            onCreated();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
