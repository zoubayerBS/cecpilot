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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Clock, Play, Lock, Unlock, StopCircle, Edit2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { parse, differenceInMinutes, isValid } from "date-fns";

const eventColorMap: { [key in typeof eventTypes[number]]: string } = {
  'Départ CEC': 'bg-emerald-500',
  'Clampage': 'bg-orange-500',
  'Déclampage': 'bg-blue-500',
  'Fin CEC': 'bg-red-500',
  'Autre': 'bg-gray-500',
};

const eventIconMap: { [key in typeof eventTypes[number]]: any } = {
  'Départ CEC': Play,
  'Clampage': Lock,
  'Déclampage': Unlock,
  'Fin CEC': StopCircle,
  'Autre': Clock,
};

export function Timeline() {
  const { control, watch } = useFormContext<CecFormValues>();
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

  const handleQuickAdd = (type: typeof eventTypes[number]) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    append({
      type,
      name: type,
      time,
    });
  };

  const calculateDuration = (time1: string, time2: string): number | null => {
    try {
      const t1 = parse(time1, 'HH:mm', new Date());
      const t2 = parse(time2, 'HH:mm', new Date());
      if (isValid(t1) && isValid(t2)) {
        return differenceInMinutes(t2, t1);
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const getDurationSummary = () => {
    const departCec = sortedFields.find(e => e.type === 'Départ CEC');
    const finCec = sortedFields.find(e => e.type === 'Fin CEC');
    const clampage = sortedFields.find(e => e.type === 'Clampage');
    const declampage = sortedFields.find(e => e.type === 'Déclampage');

    const totalCec = departCec && finCec ? calculateDuration(departCec.time!, finCec.time!) : null;
    const totalClampage = clampage && declampage ? calculateDuration(clampage.time!, declampage.time!) : null;
    const totalAssistance = declampage && finCec ? calculateDuration(declampage.time!, finCec.time!) : null;

    return { totalCec, totalClampage, totalAssistance };
  };

  const summary = getDurationSummary();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Journal des Événements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Card */}
          {sortedFields.length > 0 && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
              <div className="text-center space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total CEC</p>
                <p className="text-2xl font-black text-emerald-600">{summary.totalCec ?? '--'} <span className="text-sm font-normal">min</span></p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Clampage</p>
                <p className="text-2xl font-black text-orange-600">{summary.totalClampage ?? '--'} <span className="text-sm font-normal">min</span></p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Assistance</p>
                <p className="text-2xl font-black text-blue-600">{summary.totalAssistance ?? '--'} <span className="text-sm font-normal">min</span></p>
              </div>
            </div>
          )}

          {/* Quick Add Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd('Départ CEC')}
              className="border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <Play className="h-3 w-3 mr-2" />
              Départ CEC
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd('Clampage')}
              className="border-orange-200 hover:bg-orange-50 hover:text-orange-700 transition-colors"
            >
              <Lock className="h-3 w-3 mr-2" />
              Clampage
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd('Déclampage')}
              className="border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <Unlock className="h-3 w-3 mr-2" />
              Déclampage
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd('Fin CEC')}
              className="border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <StopCircle className="h-3 w-3 mr-2" />
              Fin CEC
            </Button>
          </div>

          {/* Timeline */}
          {sortedFields.length > 0 ? (
            <div className="relative pl-8">
              {/* Gradient Vertical Line */}
              <div className="absolute left-8 top-0 h-full w-1 bg-gradient-to-b from-emerald-500 via-orange-500 to-red-500 rounded-full -translate-x-1/2 opacity-30"></div>
              <ul className="space-y-6">
                {sortedFields.map((field, index) => {
                  const Icon = eventIconMap[field.type] || Clock;
                  const nextField = sortedFields[index + 1];
                  const duration = nextField ? calculateDuration(field.time!, nextField.time!) : null;
                  const isLastAdded = index === sortedFields.length - 1;

                  return (
                    <React.Fragment key={field.id}>
                      <li className="relative flex items-start gap-4">
                        {/* Animated Dot */}
                        <div className={cn(
                          "absolute left-0 top-1.5 h-4 w-4 rounded-full flex items-center justify-center border-2 border-background shadow-lg transition-all",
                          eventColorMap[field.type] || 'bg-primary',
                          isLastAdded && "animate-pulse scale-110"
                        )}>
                          <Icon className="h-2 w-2 text-white" />
                        </div>
                        <div className="w-20 shrink-0 pl-6">
                          <p className="font-mono font-bold text-sm">{field.time}</p>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{field.name}</p>
                              <Badge variant="secondary" className="text-[10px] px-2 py-0">
                                {field.type}
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => remove(fields.findIndex(f => f.id === field.id))}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </li>
                      {/* Duration Badge */}
                      {duration !== null && duration > 0 && (
                        <div className="relative pl-6 -my-2">
                          <div className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 border border-border/30">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-mono font-bold text-muted-foreground">
                              {duration} min
                            </span>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed border-border rounded-xl">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="font-medium">Aucun événement ajouté</p>
              <p className="text-xs mt-1">Utilisez les boutons ci-dessus pour ajouter rapidement des événements</p>
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
            Ajouter un événement personnalisé
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
                onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-type" className="text-right">Type</Label>
              <Select
                value={newEvent.type}
                onValueChange={(value) => setNewEvent(prev => ({ ...prev, type: value as typeof eventTypes[number] }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
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
                  onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
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
