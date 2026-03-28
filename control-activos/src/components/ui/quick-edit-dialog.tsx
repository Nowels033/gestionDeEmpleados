"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuickEditDialogProps {
  open: boolean;
  title: string;
  description: string;
  label: string;
  value: string;
  submitLabel?: string;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function QuickEditDialog({
  open,
  title,
  description,
  label,
  value,
  submitLabel = "Guardar cambios",
  loading = false,
  onOpenChange,
  onChange,
  onSubmit,
}: QuickEditDialogProps) {
  const inputId = React.useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor={inputId}>{label}</Label>
          <Input
            id={inputId}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSubmit();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? "Guardando..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
