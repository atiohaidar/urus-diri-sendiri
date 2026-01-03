import * as React from "react";

import { cn } from "@/lib/utils";

// Random rotation for varied tape positions
const getRandomRotation = (index?: number) => {
  if (index === undefined) return "rotate-0";
  const rotations = ["-rotate-1", "rotate-0", "rotate-1", "-rotate-2", "rotate-2"];
  return rotations[index % rotations.length];
};

// Tape position variants
const tapePositions = {
  center: "left-1/2 -translate-x-1/2",
  left: "left-4",
  right: "right-4 left-auto",
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "notebook" | "sticky";
  tapePosition?: "center" | "left" | "right" | "none";
  stickyColor?: "yellow" | "pink" | "blue" | "green";
  index?: number;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", tapePosition = "none", stickyColor = "yellow", index, ...props }, ref) => {
    const rotation = getRandomRotation(index);

    if (variant === "sticky") {
      const stickyColors = {
        yellow: "bg-sticky-yellow",
        pink: "bg-sticky-pink",
        blue: "bg-sticky-blue",
        green: "bg-sticky-green",
      };

      return (
        <div
          ref={ref}
          className={cn(
            "p-4 rounded-sm shadow-sticky font-handwriting text-ink",
            stickyColors[stickyColor],
            rotation,
            // GPU-optimized: use transform for rotation
            "will-change-transform",
            "transition-transform duration-150 ease-out",
            "hover:scale-[1.02] active:scale-[0.98]",
            className
          )}
          style={{ ["--rotation" as string]: rotation }}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          // Base notebook paper style
          "relative rounded-sm bg-card text-card-foreground",
          "border-2 border-border/50",
          "shadow-notebook",
          // GPU-optimized transitions
          "transition-all duration-150 ease-out",
          "hover:shadow-notebook-hover",
          // Tape decoration
          tapePosition !== "none" && [
            "pt-6", // Extra padding for tape
            "before:content-[''] before:absolute before:top-[-10px]",
            "before:w-14 before:h-5",
            "before:bg-gradient-to-br before:from-amber-100/90 before:to-amber-200/95",
            "before:shadow-tape before:rounded-sm",
            "before:z-10",
            tapePosition === "center" && "before:left-1/2 before:-translate-x-1/2 before:-rotate-1",
            tapePosition === "left" && "before:left-4 before:-rotate-3",
            tapePosition === "right" && "before:right-4 before:left-auto before:rotate-2",
          ],
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-4 pb-2", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-xl font-handwriting font-semibold leading-tight tracking-normal text-ink",
        className
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-pencil font-handwriting", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-4 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

// Sticky Note Card - Special variant for habits, notes, etc.
interface StickyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: "yellow" | "pink" | "blue" | "green";
  rotation?: number;
}

const StickyCard = React.forwardRef<HTMLDivElement, StickyCardProps>(
  ({ className, color = "yellow", rotation, style, ...props }, ref) => {
    const colorClasses = {
      yellow: "bg-sticky-yellow",
      pink: "bg-sticky-pink",
      blue: "bg-sticky-blue",
      green: "bg-sticky-green",
    };

    const defaultRotation = rotation ?? (Math.random() * 4 - 2);

    return (
      <div
        ref={ref}
        className={cn(
          "p-4 rounded-sm shadow-sticky",
          "font-handwriting text-ink",
          colorClasses[color],
          // GPU-optimized
          "will-change-transform",
          "transition-transform duration-150 ease-out",
          "hover:scale-[1.02] active:scale-[0.98]",
          className
        )}
        style={{
          transform: `rotate(${defaultRotation}deg)`,
          ...style,
        }}
        {...props}
      />
    );
  }
);
StickyCard.displayName = "StickyCard";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, StickyCard };
