"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ClassCard } from "~/components/dashboard/class-card";
import { CreateClassDialog } from "~/components/dashboard/create-class-dialog";
import { Button } from "~/components/ui/button";
import { createClient } from "~/lib/supabase/client";
import { fetchClassesWithDetails } from "~/lib/supabase/queries";
import type { ClassWithDetails } from "~/lib/supabase/types";

export function DashboardContent({
  initialClasses,
}: {
  initialClasses: ClassWithDetails[];
}) {
  const [classes, setClasses] = useState(initialClasses);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const data = await fetchClassesWithDetails(supabase);
    setClasses(data);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "classes" },
        refetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        refetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignments" },
        refetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "target_grades" },
        refetch,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your classes</h1>
          <p className="text-sm text-muted-foreground">
            Know exactly what you need on what&apos;s left.
          </p>
        </div>
        {classes.length > 0 && (
          <CreateClassDialog
            onCreated={refetch}
            trigger={
              <Button>
                <Plus className="size-4" />
                New class
              </Button>
            }
          />
        )}
      </div>

      {classes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-lg font-medium">No classes yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add your first class to see your current grade, your target, and
            exactly what you need on what&apos;s left.
          </p>
          <CreateClassDialog
            onCreated={refetch}
            trigger={
              <Button className="mt-2">
                <Plus className="size-4" />
                Add your first class
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => (
            <ClassCard key={cls.id} cls={cls} onChanged={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}
