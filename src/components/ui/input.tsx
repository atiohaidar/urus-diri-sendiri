import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "notebook";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex w-full text-base ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors duration-150",

          // Notebook style - like writing on lined paper
          variant === "notebook" && [
            "h-auto py-2 px-1",
            "bg-transparent",
            "font-handwriting text-lg text-ink",
            "border-0 border-b-2 border-dashed border-paper-lines",
            "rounded-none",
            "placeholder:text-pencil/50 placeholder:italic",
            "focus-visible:border-solid focus-visible:border-primary",
          ],

          // Default style - subtle notebook feel
          variant === "default" && [
            "h-11 px-4 py-2",
            "bg-card rounded-sm",
            "border-2 border-border/50",
            "font-handwriting text-ink",
            "placeholder:text-pencil/60",
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
  },
);
Input.displayName = "Input";

export { Input };
