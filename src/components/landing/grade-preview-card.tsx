import { TrendingUp } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader } from "~/components/ui/card";

export function GradePreviewCard() {
  return (
    <Card className="w-full max-w-sm border-white/10 shadow-2xl shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-black/40">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            AP Biology
          </p>
          <p className="font-semibold tracking-tight">Current grade: 87%</p>
        </div>
        <Badge variant="secondary">Target: 90%</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[87%] rounded-full bg-primary" />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-success" />
            <span className="text-sm font-medium">You need on the final</span>
          </div>
          <span className="text-lg font-bold text-foreground">96%</span>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">Remaining: Final Exam</span>
          <span className="font-medium">Weight 20%</span>
        </div>
      </CardContent>
    </Card>
  );
}
