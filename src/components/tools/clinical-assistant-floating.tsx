"use client";

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Loader2, Sparkles, Bot, Minus } from 'lucide-react';
import { askKnowledgeBase } from '@/app/actions/knowledge';
import { cn } from '@/lib/utils';

const ChatMessage = ({ role, content }: { role: 'user' | 'ai', content: string }) => (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${role === 'user'
            ? 'bg-primary text-primary-foreground rounded-tr-none shadow-sm'
            : 'bg-muted text-foreground rounded-tl-none border border-border/50'
            }`}>
            <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
    </div>
);

export function ClinicalAssistantFloating() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [messages, setMessages] = React.useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [input, setInput] = React.useState('');
    const [isThinking, setIsThinking] = React.useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Scroll to bottom
    React.useEffect(() => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            } else {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [messages, isThinking, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsThinking(true);

        try {
            const result = await askKnowledgeBase(`QUESTION DU CLINICIEN : ${userMsg}`);
            if (result.success) {
                setMessages(prev => [...prev, { role: 'ai', content: result.data as string }]);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'ai', content: `⚠️ Erreur : ${error.message || "Problème de connexion."}` }]);
        } finally {
            setIsThinking(false);
        }
    };

    const suggestedQuestions = [
        "Seuils Transfusion EACTS",
        "Protocole Sevrage CEC",
        "Calcul Index Cardiaque",
        "Gestion Alpha-stat"
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {/* Chat Window */}
            {isOpen && (
                <Card className="w-[380px] h-[550px] flex flex-col shadow-2xl border-border/40 animate-in slide-in-from-bottom-5 duration-300 rounded-3xl overflow-hidden bg-background/95 backdrop-blur-xl">
                    <CardHeader className="p-4 border-b bg-primary/5 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold">CEC Pilot Assistant IA Clinique</CardTitle>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[10px] text-muted-foreground font-medium">Llama-3.1 8B Expert</span>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsOpen(false)}>
                            <Minus className="h-4 w-4" />
                        </Button>
                    </CardHeader>

                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-6">
                                <div className="p-3 bg-primary/5 rounded-full">
                                    <Bot className="h-8 w-8 text-primary/40" />
                                </div>
                                <div className="space-y-1 px-4">
                                    <p className="text-xs font-semibold">Comment puis-je vous aider ?</p>
                                    <p className="text-[10px] text-muted-foreground">Posez une question sur les standards cliniques ou la CEC.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 w-full mt-4">
                                    {suggestedQuestions.map((q) => (
                                        <Button
                                            key={q}
                                            variant="outline"
                                            className="text-[10px] h-auto py-2 px-3 text-left justify-start hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all font-normal rounded-xl bg-background/50"
                                            onClick={() => setInput(q)}
                                        >
                                            {q}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {messages.map((m, i) => <ChatMessage key={i} role={m.role} content={m.content} />)}
                        {isThinking && (
                            <div className="flex justify-start mb-4">
                                <div className="bg-muted px-4 py-2 rounded-2xl rounded-tl-none border border-border/50 shadow-sm flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                    <span className="text-[10px] italic">Analyses en cours...</span>
                                </div>
                            </div>
                        )}
                    </ScrollArea>

                    <CardFooter className="p-4 border-t bg-card/30">
                        <form onSubmit={handleSend} className="flex w-full gap-2">
                            <Input
                                placeholder="Message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isThinking}
                                className="h-10 rounded-xl text-xs bg-background border-border/40"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isThinking || !input.trim()}
                                className="h-10 w-10 rounded-xl shadow-lg bg-primary shrink-0"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}

            {/* Trigger Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-14 w-14 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95",
                    isOpen ? "bg-muted text-foreground hover:bg-muted" : "bg-primary text-primary-foreground shadow-primary/30"
                )}
            >
                {isOpen ? (
                    <MessageSquare className="h-6 w-6" />
                ) : (
                    <div className="relative">
                        <MessageSquare className="h-6 w-6" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                    </div>
                )}
            </Button>
        </div>
    );
}
