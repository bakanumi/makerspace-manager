import { cn } from "@/lib/utils";

export function NativeSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        className
      )}
      {...props}
    />
  );
}
