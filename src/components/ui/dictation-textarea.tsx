
"use client";

import React, { forwardRef } from 'react';
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { cn } from '@/lib/utils';

interface DictationTextareaProps extends TextareaProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  isSupported: boolean;
}

const DictationTextarea = forwardRef<HTMLTextAreaElement, DictationTextareaProps>(
  ({ onChange, value, isRecording, onToggleRecording, isSupported, ...props }, ref) => {

    return (
      <div className="relative">
        <Textarea 
          ref={ref} 
          onChange={onChange} 
          value={value} 
          className={cn(isRecording && "ring-2 ring-offset-2 ring-primary transition-shadow")}
          {...props} 
        />
        {isSupported ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute bottom-2 right-2"
            onClick={onToggleRecording}
            title={isRecording ? "Arrêter la dictée" : "Démarrer la dictée"}
          >
            {isRecording ? <MicOff className="h-4 w-4 text-primary animate-pulse" /> : <Mic className="h-4 w-4" />}
          </Button>
        ) : null}
      </div>
    );
  }
);
DictationTextarea.displayName = "DictationTextarea";

export { DictationTextarea };
