"use client";

import { useId, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function AnonymousToggle({
  defaultOn = false,
  label = "Post as Anonymous",
}: {
  defaultOn?: boolean;
  label?: string;
}) {
  const [on, setOn] = useState(defaultOn);
  const id = useId();

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/70 px-3 py-2">
      <input type="hidden" name="isAnonymous" value={on ? "true" : "false"} />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
      <Switch
        id={id}
        checked={on}
        onCheckedChange={setOn}
      />
    </div>
  );
}
