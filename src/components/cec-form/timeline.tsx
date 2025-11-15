
"use client";

import * as React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Clock } from "lucide-react";
import { type CecFormValues, eventTypes, type TimelineEvent } from "./schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";


const eventColorMap: { [key in typeof eventTypes[number]]: string } = {
    'Départ CEC': 'bg-green-500',
    'Clampage': 'bg-orange-500',
    'Déclampage': 'bg-blue-500',
    'Fin CEC': 'bg-red-500',
    'Autre': 'bg-gray-500',
};


export function Timeline() {
  const { control } = useFormContext<CecFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "timelineEvents",
  });

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newEvent, setNewEvent] = React.useState<Partial<TimelineEvent>>({
    type: 'Départ CEC',
    name: '',
    time: ''
  });

  const sortedFields = React.useMemo(() => {
    return [...fields].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [fields]);

  const handleAddEvent = () => {
    if (!newEvent.time) {
        alert("Veuillez entrer une heure pour l'événement.");
        return;
    }
    const finalEvent: TimelineEvent = {
        type: newEvent.type || 'Autre',
        name: newEvent.type === 'Autre' ? (newEvent.name || 'Événement personnalisé') : newEvent.type!,
        time: newEvent.time!,
    };
    append(finalEvent);
    setNewEvent({ type: 'Départ CEC', name: '', time: '' });
    setIsModalOpen(false);
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <Clock />
              Journal des Événements
          </CardTitle>
        </CardHeader>
        <CardContent>
            {sortedFields.length > 0 ? (
                <div className="relative pl-8">
                    {/* Vertical line */}
                    <div className="absolute left-8 top-0 h-full w-0.5 bg-border -translate-x-1/2"></div>
                    <ul className="space-y-8">
                        {sortedFields.map((field, index) => (
                           <li key={field.id} className="relative flex items-start gap-4">
                               {/* Dot on the timeline */}
                               <div className={cn("absolute left-0 top-1.5 h-3 w-3 rounded-full", eventColorMap[field.type] || 'bg-primary')}></div>
                               <div className="w-20 shrink-0 pl-4">
                                   <p className="font-mono font-bold">{field.time}</p>
                               </div>
                               <div className="flex-grow">
                                   <div className="flex items-center justify-between">
                                        <div>
                                           <p className="font-semibold">{field.name}</p>
                                           <span className="bg-muted px-2 py-0.5 rounded-md text-xs text-muted-foreground">{field.type}</span>
                                        </div>
                                       <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => remove(fields.findIndex(f => f.id === field.id))}>
                                           <Trash2 className="h-4 w-4 text-destructive" />
                                       </Button>
                                   </div>
                               </div>
                           </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    Aucun événement ajouté.
                </div>
            )}
        </CardContent>
        <CardFooter className="pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un événement
            </Button>
        </CardFooter>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Ajouter un nouvel événement</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="event-time" className="text-right">Heure</Label>
                    <Input
                        id="event-time"
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent(prev => ({...prev, time: e.target.value}))}
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="event-type" className="text-right">Type</Label>
                    <Select
                        value={newEvent.type}
                        onValueChange={(value) => setNewEvent(prev => ({ ...prev, type: value as typeof eventTypes[number]}))}
                    >
                        <FormControl>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Sélectionnez un type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {eventTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 {newEvent.type === 'Autre' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="event-name" className="text-right">Nom</Label>
                        <Input
                            id="event-name"
                            value={newEvent.name}
                            onChange={(e) => setNewEvent(prev => ({...prev, name: e.target.value}))}
                            className="col-span-3"
                            placeholder="Nom de l'événement personnalisé"
                        />
                    </div>
                 )}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Annuler</Button>
                </DialogClose>
                <Button type="button" onClick={handleAddEvent}>Ajouter</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
