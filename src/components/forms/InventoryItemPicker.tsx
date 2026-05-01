// Searchable, grouped inventory item picker. Used wherever a user has to
// pick one item out of the full 600+ catalogue.

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SECTION_NAME } from "@/data/amceSections";
import { cn } from "@/lib/utils";
import type { InventoryItem } from "@/types";

type GroupBy = "category" | "section";

interface InventoryItemPickerProps {
  items: InventoryItem[];
  value: string;
  onChange: (id: string) => void;
  groupBy?: GroupBy;
  placeholder?: string;
  disabled?: boolean;
}

export function InventoryItemPicker({
  items,
  value,
  onChange,
  groupBy = "category",
  placeholder = "Search inventory item...",
  disabled,
}: InventoryItemPickerProps) {
  const [open, setOpen] = useState(false);

  const selected = items.find((i) => i.id === value);

  const groups = useMemo(() => {
    const m = new Map<string, InventoryItem[]>();
    for (const item of items) {
      if (!item.active) continue;
      const key =
        groupBy === "section"
          ? SECTION_NAME[item.laboratorySection] ?? "Other"
          : item.category || "Uncategorised";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(item);
    }
    return Array.from(m.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, list]) => ({
        name,
        items: list.sort((a, b) => a.itemName.localeCompare(b.itemName)),
      }));
  }, [items, groupBy]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate text-left">
            {selected ? (
              <>
                {selected.itemName}
                <span className="text-muted-foreground"> — {selected.category}</span>
              </>
            ) : (
              "Select inventory item"
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command
          filter={(value, search) =>
            value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder={placeholder} />
          <CommandList className="max-h-72">
            <CommandEmpty>No item matches.</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.name} heading={group.name}>
                {group.items.map((item) => {
                  // Combine fields into the searchable value so users can
                  // type item name, category, manufacturer, or section.
                  const haystack = [
                    item.itemName,
                    item.category,
                    item.manufacturer ?? "",
                    SECTION_NAME[item.laboratorySection] ?? "",
                    item.catalogueNumber ?? "",
                  ].join(" ");
                  return (
                    <CommandItem
                      key={item.id}
                      value={haystack}
                      onSelect={() => {
                        onChange(item.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === item.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{item.itemName}</span>
                        <span className="text-xs text-muted-foreground">
                          {SECTION_NAME[item.laboratorySection] ?? "—"} ·{" "}
                          {item.unitOfIssue}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
