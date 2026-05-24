"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, getStatusColor } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";

export interface WorkflowStep {
  id: number;
  label: string;
  status: "completed" | "current" | "pending";
  colorSlug?: string | null;
}

interface WorkflowTrackerProps {
  steps: WorkflowStep[];
  title?: string;
  onStepClick?: (statusId: number) => void;
  updating?: boolean;
}

export function WorkflowTracker({ steps, title = "Status Produksi", onStepClick, updating = false }: WorkflowTrackerProps) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  
  return (
    <Card className="!p-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{
              width: `${(completedCount / steps.length) * 100}%`,
            }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
                {/* Circle */}
                <button
                  onClick={() => onStepClick && !updating && onStepClick(step.id)}
                  disabled={updating}
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-background z-10",
                    step.status === "completed"
                      ? "border-primary bg-primary text-primary-foreground"
                      : step.status === "current"
                      ? "border-primary bg-primary/10 text-primary animate-pulse"
                      : "border-border text-muted-foreground",
                    onStepClick && !updating && "cursor-pointer hover:scale-110 hover:shadow-lg",
                    updating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : step.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </button>

                {/* Label */}
                <button
                  onClick={() => onStepClick && !updating && onStepClick(step.id)}
                  disabled={updating}
                  className={cn(
                    "text-center px-2 py-1 rounded-md text-xs font-medium min-w-[80px]",
                    step.status !== "pending"
                      ? getStatusColor(step.colorSlug || "blue")
                      : "text-muted-foreground",
                    onStepClick && !updating && "cursor-pointer hover:scale-105 transition-transform",
                    updating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {step.label}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Progress: {completedCount} / {steps.length} tahapan selesai
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
