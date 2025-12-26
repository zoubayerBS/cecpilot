"use client";

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Sparkles, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { askKnowledgeBase } from '@/app/actions/knowledge';

// Simple Chat Message component
const ChatMessage = ({ role, content }: { role: 'user' | 'ai', content: string }) => (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
        <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${role === 'user'
            ? 'bg-primary text-primary-foreground rounded-tr-none shadow-lg'
            : 'bg-card text-foreground rounded-tl-none border border-border/50 shadow-sm'
            }`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
    </div>
);

export function KnowledgeBase() {
    const [messages, setMessages] = React.useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [input, setInput] = React.useState('');
    const [isThinking, setIsThinking] = React.useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Scroll to bottom on new messages
    React.useEffect(() => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            } else {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [messages, isThinking]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsThinking(true);

        try {
            const prompt = `QUESTION DU CLINICIEN : ${userMsg}`;
            const result = await askKnowledgeBase(prompt);

            if (result.success) {
                setMessages(prev => [...prev, { role: 'ai', content: result.data as string }]);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            console.error(error);
            setMessages(prev => [...prev, {
                role: 'ai',
                content: `⚠️ Erreur : ${error.message || "Un problème est survenu lors de la communication avec l'IA."}`
            }]);
            toast({
                variant: "destructive",
                title: "Erreur de connexion",
                description: "L'assistant n'a pas pu répondre. Vérifiez votre clé HF_TOKEN.",
            });
        } finally {
            setIsThinking(false);
        }
    };

    const suggestedQuestions = [
        "Seuils de transfusion EACTS 2024",
        "Protocole de sevrage de CEC",
        "Optimisation du débit cardiaque",
        "Gestion du pH (Alpha-stat vs pH-stat)"
    ];

    return (
        <div className="flex flex-col h-[750px] w-full max-w-5xl mx-auto px-4 lg:px-0">
            <Card className="flex-1 flex flex-col border-none shadow-2xl bg-gradient-to-br from-card to-background overflow-hidden relative border border-border/40 rounded-3xl">
                {/* Header Section */}
                <CardHeader className="border-b bg-card/50 backdrop-blur-md z-10 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-primary/10 rounded-2xl">
                                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">Assistant IA Clinique</CardTitle>
                                <CardDescription className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    Intelligence Médicale Globale (Directives Internationales)
                                </CardDescription>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-mono text-[10px] py-1 px-3 rounded-full">
                                LLAMA-3.1 8B EXPERT
                            </Badge>
                        </div>
                    </div>
                </CardHeader>

                {/* Chat Display Area */}
                <ScrollArea className="flex-1 px-6 py-8" ref={scrollRef}>
                    <div className="max-w-4xl mx-auto pb-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center min-h-[450px] text-center space-y-6 animate-in fade-in zoom-in slide-in-from-bottom-10 duration-700">
                                <div className="p-5 bg-primary/5 rounded-full mb-2">
                                    <Bot className="h-14 w-14 text-primary/30" />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-bold text-foreground">Expertise CEC à votre service</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto leading-relaxed text-sm">
                                        Posez une question complexe sur la chirurgie cardiaque ou la perfusion.
                                        L'IA utilise les standards EACTS, SCTS et AHA pour vous guider.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mt-12 bg-muted/20 p-6 rounded-3xl border border-border/50">
                                    {suggestedQuestions.map((q) => (
                                        <Button
                                            key={q}
                                            variant="ghost"
                                            className="justify-start text-xs h-auto py-3 px-4 hover:bg-primary/10 hover:text-primary transition-all font-medium border border-transparent hover:border-primary/20 rounded-xl bg-background/50 shadow-sm"
                                            onClick={() => {
                                                setInput(q);
                                            }}
                                        >
                                            {q}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((m, i) => (
                            <ChatMessage key={i} role={m.role} content={m.content} />
                        ))}

                        {isThinking && (
                            <div className="flex justify-start mb-6">
                                <div className="bg-card text-foreground rounded-2xl rounded-tl-none px-5 py-3 border border-border/50 shadow-sm flex items-center gap-3">
                                    <div className="flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">Expertise en cours...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <CardFooter className="p-6 bg-card/30 backdrop-blur-xl border-t shadow-[0_-8px_24px_rgba(0,0,0,0.02)]">
                    <form onSubmit={handleSendMessage} className="flex w-full gap-4 max-w-4xl mx-auto relative">
                        <Input
                            placeholder="Interroger l'IA clinique..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isThinking}
                            className="flex-1 h-14 rounded-2xl border-border/40 focus-visible:ring-primary/50 text-base px-6 bg-background shadow-inner"
                        />
                        <Button
                            type="submit"
                            disabled={isThinking || !input.trim()}
                            className="h-14 w-14 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all bg-primary hover:bg-primary/90"
                        >
                            {isThinking ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}
