import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus, Clock, Trash2, Save, GripVertical, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getRoutines, saveRoutines, checkOverlap, calculateDuration, parseTimeToMinutes, type RoutineItem } from '@/lib/storage';
import { toast } from 'sonner';
import BulkAddDialog from '@/components/BulkAddDialog';

const CATEGORIES = [
    'Mindfulness',
    'Fitness',
    'Nutrition',
    'Productivity',
    'Spiritual',
    'Learning',
    'Other',
];

const EditSchedule = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<RoutineItem[]>([]);
    const [showBulkAdd, setShowBulkAdd] = useState(false);

    // Edit Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        startTime: '',
        endTime: '',
        activity: '',
        category: '',
    });

    useEffect(() => {
        setItems(getRoutines());
    }, []);

    const startEdit = (item: RoutineItem) => {
        if (editingId === item.id) {
            cancelEdit();
            return;
        }

        setEditForm({
            startTime: item.startTime,
            endTime: item.endTime,
            activity: item.activity,
            category: item.category,
        });
        setEditingId(item.id);
    };

    const startAdd = () => {
        const newId = Date.now().toString();
        // Default new item
        const newItem: RoutineItem = {
            id: newId,
            startTime: '09:00',
            endTime: '09:30',
            activity: '',
            category: 'Productivity',
        };

        setItems([newItem, ...items]);

        // Immediately start editing
        setEditForm({
            startTime: '09:00',
            endTime: '09:30',
            activity: '',
            category: 'Productivity',
        });
        setEditingId(newId);
    };

    const cancelEdit = () => {
        const item = items.find(i => i.id === editingId);
        if (item && !item.activity.trim()) {
            setItems(items.filter(i => i.id !== editingId));
        }
        setEditingId(null);
    };

    const saveItem = () => {
        if (!editForm.activity.trim()) {
            toast.error('Activity name is required');
            return;
        }

        if (editForm.endTime <= editForm.startTime) {
            toast.error('End time must be after start time');
            return;
        }

        const updatedItems = items.map(item => {
            if (item.id === editingId) {
                return {
                    ...item,
                    startTime: editForm.startTime,
                    endTime: editForm.endTime,
                    activity: editForm.activity,
                    category: editForm.category
                };
            }
            return item;
        });

        // Auto sort by time
        updatedItems.sort((a, b) => {
            const timeA = parseTimeToMinutes(a.startTime);
            const timeB = parseTimeToMinutes(b.startTime);
            return timeA - timeB;
        });

        setItems(updatedItems);
        saveRoutines(updatedItems);
        setEditingId(null);
        toast.success('Saved');
    };

    const deleteItem = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newItems = items.filter(i => i.id !== id);
        setItems(newItems);
        saveRoutines(newItems);
        if (editingId === id) setEditingId(null);
        toast.success('Deleted');
    };

    const handleBulkSave = (newItems: RoutineItem[]) => {
        const updated = [...items, ...newItems];
        updated.sort((a, b) => {
            const timeA = parseTimeToMinutes(a.startTime);
            const timeB = parseTimeToMinutes(b.startTime);
            return timeA - timeB;
        });
        setItems(updated);
        saveRoutines(updated);
        toast.success(`Added ${newItems.length} items!`);
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-4 mb-4">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-xl font-bold">Edit Schedule</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setShowBulkAdd(true)} variant="outline" size="sm" className="gap-1 rounded-xl">
                            <GripVertical className="w-4 h-4" />
                            Import
                        </Button>
                        <Button onClick={startAdd} size="sm" className="gap-1 rounded-xl">
                            <Plus className="w-4 h-4" />
                            Add
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container max-w-md mx-auto px-4 space-y-3">
                {items.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        No routines found. Start by adding one!
                    </div>
                )}

                {items.map((item) => {
                    const isEditing = editingId === item.id;

                    // Calculate overlap for display
                    // NOTE: Pass the item itself if not editing, or the form values if editing (for real-time check)
                    const checkItem = isEditing ? {
                        ...item,
                        startTime: editForm.startTime,
                        endTime: editForm.endTime,
                        // temporary duration doesn't matter for overlap check as we use start/end in storage.ts now
                    } : item;

                    const isOverlap = items.some(other => other.id !== item.id && checkOverlap(checkItem, other));

                    if (isEditing) {
                        return (
                            <div key={item.id} className={cn("bg-card border-2 rounded-3xl p-4 shadow-lg animate-in fade-in zoom-in-95 duration-200", isOverlap ? "border-destructive" : "border-primary/20")}>
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
                                            onChange={(e) => setEditForm({ ...editForm, activity: e.target.value })}
                                            placeholder="e.g. Morning Jog"
                                            className="bg-background mt-1.5 h-11 rounded-xl"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground ml-1">Start Time</label>
                                            <div className="relative mt-1.5">
                                                <Input
                                                    type="time"
                                                    value={editForm.startTime}
                                                    onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                                                    className="bg-background h-11 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground ml-1">End Time</label>
                                            <div className="relative mt-1.5">
                                                <Input
                                                    type="time"
                                                    value={editForm.endTime}
                                                    onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                                                    className="bg-background h-11 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground ml-1">Category</label>
                                        <Select
                                            value={editForm.category}
                                            onValueChange={(val) => setEditForm({ ...editForm, category: val })}
                                        >
                                            <SelectTrigger className="mt-1.5 h-11 rounded-xl bg-background">
                                                <SelectValue placeholder="Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CATEGORIES.map(c => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button variant="outline" className="flex-1 rounded-xl" onClick={cancelEdit}>
                                            Cancel
                                        </Button>
                                        <Button className="flex-1 rounded-xl gap-2" onClick={saveItem}>
                                            <Save className="w-4 h-4" /> Save
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={item.id}
                            onClick={() => startEdit(item)}
                            className={cn(
                                "group bg-card hover:bg-muted/50 transition-colors p-4 rounded-3xl border border-border/50 flex items-center gap-4 cursor-pointer active:scale-[0.98] duration-200",
                                isOverlap && "border-destructive/50 bg-destructive/5"
                            )}
                        >
                            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary font-bold text-xs shrink-0 leading-tight">
                                <span>{item.startTime}</span>
                                <ArrowRight className="w-3 h-3 opacity-50 my-px rotate-90" />
                                <span className="opacity-80">{item.endTime}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground truncate">{item.activity}</h3>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span className="bg-muted px-2 py-0.5 rounded-full">{item.category}</span>
                                    <span>•</span>
                                    <span>{calculateDuration(item.startTime, item.endTime)}</span>
                                    {isOverlap && (
                                        <span className="flex items-center gap-1 text-destructive font-medium">
                                            <AlertTriangle className="w-3 h-3" />
                                            Overlap
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground/30 group-hover:text-destructive transition-colors -mr-2"
                                onClick={(e) => deleteItem(e, item.id)}
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    );
                })}
            </div>

            {/* Bulk Add Dialog */}
            <BulkAddDialog
                open={showBulkAdd}
                onClose={() => setShowBulkAdd(false)}
                onSave={handleBulkSave}
            />
        </div>
    );
};

export default EditSchedule;
