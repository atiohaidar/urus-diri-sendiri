import { Skeleton } from "@/components/ui/skeleton";

export const ReflectionSkeleton = () => {
    return (
        <div className="bg-card rounded-3xl card-elevated overflow-hidden border border-border/40 mb-4 p-4">
            <div className="flex items-center justify-between">
                <div className="flex-1 space-y-3">
                    {/* Date and Badges */}
                    <div className="flex items-center justify-between pr-4">
                        <Skeleton className="h-3 w-24" />
                        <div className="flex gap-2">
                            <Skeleton className="h-4 w-12 rounded-md" />
                            <Skeleton className="h-4 w-12 rounded-md" />
                        </div>
                    </div>
                    {/* Main Title */}
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-3/4 rounded-lg" />
                    </div>
                </div>
                {/* Chevron */}
                <Skeleton className="h-6 w-6 rounded-full ml-4" />
            </div>
        </div>
    );
};
