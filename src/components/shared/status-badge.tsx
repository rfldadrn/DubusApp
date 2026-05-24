import { cn, getStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  name: string;
  colorSlug: string | null;
  className?: string;
}

export function StatusBadge({ name, colorSlug, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "px-3 py-1 font-medium",
        getStatusColor(colorSlug),
        className
      )}
    >
      {name}
    </Badge>
  );
}
