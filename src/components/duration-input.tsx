"use client";

import { Input } from "@/components/ui/input";

export function DurationInput({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: number;
  onChange: (hours: number) => void;
}) {
  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const update = (h: number, m: number) => {
    const clampedMinutes = Math.min(59, Math.max(0, m));
    onChange(Math.max(0, h) + clampedMinutes / 60);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Input
        id={id}
        type="number"
        min={0}
        step={1}
        className="w-16"
        value={hours}
        onChange={(e) => update(Number(e.target.value) || 0, minutes)}
      />
      <span className="text-muted-foreground text-sm">Std</span>
      <Input
        type="number"
        min={0}
        max={59}
        step={1}
        className="w-16"
        value={minutes}
        onChange={(e) => update(hours, Number(e.target.value) || 0)}
      />
      <span className="text-muted-foreground text-sm">Min</span>
    </div>
  );
}
