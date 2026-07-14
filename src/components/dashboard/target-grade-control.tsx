"use client";

import { useState } from "react";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { GRADE_LETTER_PRESETS } from "~/lib/grade-calculator";

function modeForValue(value: number | null): string {
  if (value == null) return "B";
  for (const [letter, cutoff] of Object.entries(GRADE_LETTER_PRESETS)) {
    if (value === cutoff) return letter;
  }
  return "custom";
}

export function TargetGradeControl({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number) => void;
}) {
  const [mode, setMode] = useState(() => modeForValue(value));
  const [customValue, setCustomValue] = useState(
    mode === "custom" && value != null ? String(value) : "",
  );

  function handleModeChange(next: string) {
    setMode(next);
    if (next === "custom") {
      if (customValue) onChange(Number(customValue));
      return;
    }
    onChange(GRADE_LETTER_PRESETS[next] ?? 80);
  }

  function handleCustomChange(raw: string) {
    setCustomValue(raw);
    const parsed = Number(raw);
    if (raw !== "" && !Number.isNaN(parsed)) {
      onChange(Math.min(100, Math.max(0, parsed)));
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={mode} onValueChange={handleModeChange}>
        <SelectTrigger size="sm" className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(GRADE_LETTER_PRESETS).map((letter) => (
            <SelectItem key={letter} value={letter}>
              {letter}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom %</SelectItem>
        </SelectContent>
      </Select>
      {mode === "custom" && (
        <Input
          type="number"
          min={0}
          max={100}
          placeholder="%"
          value={customValue}
          onChange={(e) => handleCustomChange(e.target.value)}
          className="w-20"
        />
      )}
    </div>
  );
}
