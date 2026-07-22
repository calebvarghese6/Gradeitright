"use client";

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
import { cancelSubscription } from "~/lib/stripe/actions";

export function CancelSubscriptionDialog({
  currentPeriodEnd,
}: {
  currentPeriodEnd: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Cancel subscription
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Auto Sync?</DialogTitle>
          <DialogDescription>
            You&apos;ll keep auto-sync and AI summaries until{" "}
            {currentPeriodEnd
              ? new Date(currentPeriodEnd).toLocaleDateString()
              : "the end of your current billing period"}
            , then your plan will switch to manual entry. You can resume anytime
            before then from this page.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Keep my plan
          </Button>
          <form action={cancelSubscription}>
            <Button type="submit" variant="destructive" className="w-full">
              Cancel subscription
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
