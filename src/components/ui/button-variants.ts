import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    // Base styles - optimized for mobile touch
    [
        "inline-flex items-center justify-center gap-2 whitespace-nowrap",
        "text-base font-medium",
        "ring-offset-background",
        "transition-all duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        // GPU-optimized touch feedback
        "active:scale-[0.97]",
        "will-change-transform",
    ].join(" "),
    {
        variants: {
            variant: {
                // Primary - Sticker style
                default: [
                    "bg-primary text-primary-foreground",
                    "font-handwriting text-lg",
                    "border-2 border-ink/15",
                    "shadow-notebook",
                    "rounded-sm",
                    "hover:shadow-notebook-hover",
                    "hover:-translate-y-0.5",
                ].join(" "),

                // Sticky note button
                sticker: [
                    "bg-sticky-yellow text-ink",
                    "font-handwriting text-lg",
                    "border-2 border-ink/10",
                    "shadow-sticky",
                    "rounded-sm",
                    "-rotate-1",
                    "hover:rotate-0",
                ].join(" "),

                // Destructive
                destructive: [
                    "bg-destructive text-destructive-foreground",
                    "font-handwriting",
                    "shadow-notebook",
                    "hover:bg-destructive/90",
                ].join(" "),

                // Outline - Dashed border like notebook
                outline: [
                    "border-2 border-dashed border-ink/30",
                    "bg-transparent text-ink",
                    "font-handwriting",
                    "hover:bg-paper/50 hover:border-ink/50",
                    "rounded-sm",
                ].join(" "),

                // Secondary
                secondary: [
                    "bg-secondary text-secondary-foreground",
                    "border border-border",
                    "shadow-sm",
                    "hover:bg-secondary/80",
                    "rounded-sm",
                ].join(" "),

                // Ghost - Minimal
                ghost: [
                    "text-ink",
                    "hover:bg-paper-lines/20",
                    "rounded-sm",
                ].join(" "),

                // Link with squiggle underline feel
                link: [
                    "text-primary underline-offset-4",
                    "hover:underline",
                    "decoration-wavy decoration-2",
                ].join(" "),
            },
            size: {
                default: "h-11 px-5 py-2",
                sm: "h-9 px-3 text-sm",
                lg: "h-12 px-8 text-lg",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);
