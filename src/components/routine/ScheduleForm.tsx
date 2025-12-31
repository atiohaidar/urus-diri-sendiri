import { Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimePicker } from '@/components/ui/time-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CATEGORY_LIST } from '@/lib/constants';

interface ScheduleFormProps {
    editForm: {
        startTime: string;
        endTime: string;
        activity: string;
        category: string;
        description?: string;
    };
    isOverlap: boolean;
    onFormChange: (updates: any) => void;
    onSave: () => void;
    onCancel: () => void;
}

export const ScheduleForm = ({
    editForm,
    isOverlap,
    onFormChange,
    onSave,
    onCancel
}: ScheduleFormProps) => {
    return (
        <div className={cn(
            "bg-card border-2 rounded-3xl p-4 shadow-lg animate-in fade-in zoom-in-95 duration-200",
            isOverlap ? "border-destructive" : "border-primary/20"
        )}>
            <div className="space-y-4">
                {isOverlap && (
                    <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-2 rounded-lg text-sm font-medium">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Overlaps with another schedule!</span>
                    </div>
                )}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground ml-1">Activity Name</label>
                    <Input
                        autoFocus
                        value={editForm.activity}
                        onChange={(e) => onFormChange({ activity: e.target.value })}
                        placeholder="e.g. Morning Jog"
                        className="bg-background mt-1.5 h-11 rounded-xl"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground ml-1">Start Time</label>
                        <div className="relative mt-1.5">
                            <TimePicker
                                value={editForm.startTime}
                                onChange={(val) => onFormChange({ startTime: val })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground ml-1">End Time</label>
                        <div className="relative mt-1.5">
                            <TimePicker
                                value={editForm.endTime}
                                onChange={(val) => onFormChange({ endTime: val })}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-muted-foreground ml-1">Category</label>
                    <Select
                        value={editForm.category}
                        onValueChange={(val) => onFormChange({ category: val })}
                    >
                        <SelectTrigger className="mt-1.5 h-11 rounded-xl bg-background">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORY_LIST.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="text-xs font-semibold text-muted-foreground ml-1">Description (Optional)</label>
                    <textarea
                        value={editForm.description || ''}
                        onChange={(e) => onFormChange({ description: e.target.value })}
                        placeholder="Details about this routine..."
                        className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5 resize-none"
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button className="flex-1 rounded-xl gap-2" onClick={onSave}>
                        <Save className="w-4 h-4" /> Save
                    </Button>
                </div>
            </div>
        </div>
    );
};
