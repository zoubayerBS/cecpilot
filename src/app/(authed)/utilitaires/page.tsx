'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { List, Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { getUtilityList, addUtilityItem, deleteUtilityItem } from '@/services/utilities';
import { useToast } from '@/hooks/use-toast';
import type { UtilityCategory } from '@/components/cec-form/schema';
import { TensorFlowMonitor } from '@/components/tools/tensorflow-monitor';
import { BrainCircuit } from 'lucide-react';

const utilityCategories: { id: UtilityCategory, name: string, description: string }[] = [
    { id: 'interventions', name: 'Interventions', description: "Gérez la liste des interventions chirurgicales." },
    { id: 'chirurgiens', name: 'Chirurgiens', description: "Gérez la liste des chirurgiens et opérateurs." },
    { id: 'anesthesistes', name: 'Anesthésistes', description: "Gérez la liste des médecins anesthésistes." },
    { id: 'techniciens-anesthesie', name: "T.Anesthésiste", description: "Gérez la liste des techniciens d'anesthésie." },
    { id: 'personnel', name: 'Autre Personnel', description: "Gérez les aides, instrumentistes, perfusionnistes, etc." },
    { id: 'oxygenateur', name: 'Oxygénateurs', description: "Gérez la liste des oxygénateurs." },
    { id: 'circuit', name: 'Circuits', description: "Gérez la liste des circuits." },
    { id: 'canule_art', name: 'Canules Artérielles', description: "Gérez la liste des canules artérielles." },
    { id: 'canule_vein', name: 'Canules Veineuses', description: "Gérez la liste des canules veineuses." },
    { id: 'canule_cardio', name: 'Canules Cardioplégie', description: "Gérez la liste des canules de cardioplégie." },
    { id: 'canule_decharge', name: 'Canules Décharge', description: "Gérez la liste des canules de décharge." },
    { id: 'kit_hemo', name: 'Kits Hémofiltration', description: "Gérez la liste des kits d'hémofiltration." },
];

function UtilityManager({ category, name, description }: { category: UtilityCategory, name: string, description: string }) {
    const [items, setItems] = useState<string[]>([]);
    const [newItem, setNewItem] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                const list = await getUtilityList(category);
                setItems(list);
            } catch (error) {
                console.error(`Failed to fetch ${name}:`, error);
                toast({ title: `Erreur`, description: `Impossible de charger la liste : ${name}.`, variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [category, name, toast]);

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        setIsAdding(true);
        try {
            await addUtilityItem(category, newItem.trim());
            setItems(prev => [...prev, newItem.trim()].sort());
            setNewItem('');
            toast({ title: 'Succès', description: `"${newItem.trim()}" a été ajouté à ${name}.` });
        } catch (error) {
            console.error(`Failed to add item to ${name}:`, error);
            toast({ title: 'Erreur', description: `Impossible d'ajouter l'élément.`, variant: 'destructive' });
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteItem = async (itemToDelete: string) => {
        try {
            await deleteUtilityItem(category, itemToDelete);
            setItems(prev => prev.filter(item => item !== itemToDelete));
            toast({ title: 'Succès', description: `"${itemToDelete}" a été supprimé de ${name}.` });
        } catch (error) {
            console.error(`Failed to delete item from ${name}:`, error);
            toast({ title: 'Erreur', description: `Impossible de supprimer l'élément.`, variant: 'destructive' });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{name}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddItem} className="flex items-center gap-2 mb-4">
                    <Input
                        value={newItem}
                        onChange={e => setNewItem(e.target.value)}
                        placeholder={`Ajouter un nouvel élément...`}
                        disabled={isAdding}
                    />
                    <Button type="submit" disabled={isAdding || !newItem.trim()}>
                        {isAdding ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                        <span className="sr-only">Ajouter</span>
                    </Button>
                </form>

                {loading ? (
                    <div className="text-center p-4">
                        <Loader2 className="animate-spin mx-auto text-muted-foreground" />
                    </div>
                ) : (
                    <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                        {items.length > 0 ? items.map((item, index) => (
                            <div key={`${item}-${index}`} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                                <span className="text-sm">{item}</span>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">Supprimer</span>
                                </Button>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Aucun élément dans cette liste.</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}




export default function UtilitiesPage() {
    return (
        <>
            <header className="bg-card shadow-sm">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <List />
                        Gestion des Utilitaires
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Gérez les listes déroulantes utilisées dans les formulaires de compte rendu.
                    </p>
                </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">

                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <BrainCircuit className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-semibold">État Système AI (TensorFlow.js)</h2>
                    </div>
                    <TensorFlowMonitor />
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><List className="h-5 w-5" /> Listes de Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {utilityCategories.map(cat => (
                            <UtilityManager
                                key={cat.id}
                                category={cat.id}
                                name={cat.name}
                                description={cat.description}
                            />
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
}