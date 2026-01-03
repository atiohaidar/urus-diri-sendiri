import { Save, AlertTriangle, X } from 'lucide-react';
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
            "bg-card border-2 rounded-sm p-4 shadow-notebook",
            isOverlap ? "border-doodle-red" : "border-doodle-primary"
        )}>
            <div className="space-y-4">
                {isOverlap && (
                    <div className="flex items-center gap-2 text-doodle-red bg-doodle-red/10 p-2 rounded-sm font-handwriting text-sm border-2 border-dashed border-doodle-red/30">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Jadwal bertabrakan! ⚠️</span>
                    </div>
                )}
                <div>
                    <label className="font-handwriting text-sm text-pencil ml-1">Nama Aktivitas</label>
                    <Input
                        autoFocus
                        value={editForm.activity}
                        onChange={(e) => onFormChange({ activity: e.target.value })}
                        placeholder="e.g. Morning Jog"
                        variant="notebook"
                        className="mt-1.5 font-handwriting"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="font-handwriting text-sm text-pencil ml-1">Mulai</label>
                        <div className="relative mt-1.5">
                            <TimePicker
                                value={editForm.startTime}
                                onChange={(val) => onFormChange({ startTime: val })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="font-handwriting text-sm text-pencil ml-1">Selesai</label>
                        <div className="relative mt-1.5">
                            <TimePicker
                                value={editForm.endTime}
                                onChange={(val) => onFormChange({ endTime: val })}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="font-handwriting text-sm text-pencil ml-1">Kategori</label>
                    <Select
                        value={editForm.category}
                        onValueChange={(val) => onFormChange({ category: val })}
                    >
                        <SelectTrigger className="mt-1.5 h-11 rounded-sm bg-paper border-2 border-dashed border-paper-lines font-handwriting">
                            <SelectValue placeholder="Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORY_LIST.map(c => (
                                <SelectItem key={c} value={c} className="font-handwriting">{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="font-handwriting text-sm text-pencil ml-1">Deskripsi (Opsional)</label>
                    <textarea
                        value={editForm.description || ''}
                        onChange={(e) => onFormChange({ description: e.target.value })}
                        placeholder="Detail tentang rutinitas ini..."
                        className={cn(
                            "flex min-h-[80px] w-full mt-1.5 resize-none",
                            "rounded-sm border-2 border-dashed border-paper-lines bg-paper px-3 py-2",
                            "font-handwriting text-ink placeholder:text-pencil/50",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-doodle-primary focus-visible:ring-offset-2"
                        )}
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-sm font-handwriting border-2 border-dashed border-pencil/40"
                        onClick={onCancel}
                    >
                        <X className="w-4 h-4 mr-1" /> Batal
                    </Button>
                    <Button
                        className="flex-1 rounded-sm gap-2 font-handwriting bg-doodle-primary hover:bg-doodle-primary/90 shadow-notebook"
                        onClick={onSave}
                    >
                        <Save className="w-4 h-4" /> Simpan
                    </Button>
                </div>
            </div>
        </div>
    );
};
