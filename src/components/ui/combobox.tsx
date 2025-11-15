
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getUtilityList, addUtilityItem } from "@/services/utilities"
import { type UtilityCategory } from "../cec-form/schema"
import { useToast } from "@/hooks/use-toast"

interface ComboboxProps {
    category: UtilityCategory;
    value: string;
    onChange: (value: string) => void;
}

export function Combobox({ category, value, onChange }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [options, setOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const list = await getUtilityList(category);
        setOptions(list.map(item => ({ value: item.toLowerCase(), label: item })));
      } catch (error) {
        console.error(`Failed to fetch ${category}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, [category]);

  const handleSelect = (currentValue: string) => {
    onChange(currentValue === value ? "" : options.find(o => o.value === currentValue)?.label || '');
    setOpen(false);
  }
  
  const handleAddNew = async () => {
    if (search && !options.some(o => o.label.toLowerCase() === search.toLowerCase())) {
       try {
        await addUtilityItem(category, search);
        const newOption = { value: search.toLowerCase(), label: search };
        setOptions(prev => [...prev, newOption].sort((a,b) => a.label.localeCompare(b.label)));
        onChange(search);
        toast({ title: 'Succès', description: `"${search}" a été ajouté.` });
        setSearch('');
        setOpen(false);
      } catch (error) {
        toast({ title: 'Erreur', description: `Impossible d'ajouter l'élément.`, variant: 'destructive' });
      }
    }
  }

  const filteredOptions = search 
    ? options.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const displayValue = value ? (options.find(o => o.label === value)?.label || value) : "Sélectionner...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{minWidth: 'var(--radix-popover-trigger-width)'}}>
        <Command>
          <CommandInput 
            placeholder="Rechercher ou ajouter..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
                <div className="p-2">
                    <p className="text-center text-sm mb-2">Aucun résultat trouvé.</p>
                    <Button className="w-full" size="sm" onClick={handleAddNew}>
                        <PlusCircle className="mr-2" />
                        Ajouter "{search}"
                    </Button>
                </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.label ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
           </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
