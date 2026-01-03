import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "notebook";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base
          "flex w-full text-base ring-offset-background",
          "placeholder:text-pencil/60 placeholder:italic",
          "focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors duration-150",
          "resize-none",

          // Notebook style - lined paper feel
          variant === "notebook" && [
            "min-h-[120px] p-3",
            "bg-transparent",
            "font-handwriting text-lg text-ink leading-7",
            "border-0 rounded-none",
            // Lined paper background
            "bg-[repeating-linear-gradient(transparent,transparent_27px,hsl(var(--paper-lines)/0.4)_27px,hsl(var(--paper-lines)/0.4)_28px)]",
          ],

          // Default style
          variant === "default" && [
            "min-h-[100px] px-4 py-3",
            "bg-card rounded-sm",
            "border-2 border-border/50",
            "font-handwriting text-ink",
            "shadow-sm",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "focus-visible:border-primary/50",
          ],

          className,
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
