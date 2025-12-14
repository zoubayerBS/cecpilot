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
import { useQuery, useQueryClient } from '@tanstack/react-query';


interface ComboboxProps {
    category: UtilityCategory;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function Combobox({ category, value, onChange, disabled }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: options = [], isLoading } = useQuery<string[]>({
    queryKey: ['utilities', category],
    queryFn: () => getUtilityList(category),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formattedOptions = React.useMemo(() => 
    options.map(item => ({ value: item.toLowerCase(), label: item }))
  , [options]);


  const handleSelect = (currentValue: string) => {
    onChange(currentValue === value ? "" : formattedOptions.find(o => o.value === currentValue)?.label || '');
    setOpen(false);
  }
  
  const handleAddNew = async () => {
    if (search && !formattedOptions.some(o => o.label.toLowerCase() === search.toLowerCase())) {
       try {
        await addUtilityItem(category, search);
        await queryClient.invalidateQueries({ queryKey: ['utilities', category] });
        onChange(search);
        toast({ title: 'Succès', description: `"${search}" a été ajouté.` });
        setSearch('');
        setOpen(false);
      } catch (error) {
        toast({ title: 'Erreur', description: (error as Error).message, variant: 'destructive' });
      }
    }
  }

  const filteredOptions = search 
    ? formattedOptions.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase())
      )
    : formattedOptions;

  const displayValue = value ? (formattedOptions.find(o => o.label === value)?.label || value) : "Sélectionner...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
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