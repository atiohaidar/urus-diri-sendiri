import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus, Clock, Trash2, Save, GripVertical, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getRoutines, saveRoutines, checkOverlap, type RoutineItem } from '@/lib/storage';
import { toast } from 'sonner';

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

    // Edit Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        time: '',
        activity: '',
        durationVal: '',
        durationUnit: 'mins',
        category: '',
    });

    useEffect(() => {
        setItems(getRoutines());
    }, []);

    // Helper to parse "06:00 AM" -> "06:00" (24h format for input)
    const toInputTime = (timeStr: string) => {
        if (!timeStr) return '';
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return '';
        let [_, h, m, p] = match;
        let hour = parseInt(h);
        if (p.toUpperCase() === 'PM' && hour !== 12) hour += 12;
        if (p.toUpperCase() === 'AM' && hour === 12) hour = 0;
        return `${hour.toString().padStart(2, '0')}:${m}`;
    };

    // Helper to parse "06:00" -> "06:00 AM"
    const fromInputTime = (timeStr: string) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':');
        let hour = parseInt(h);
        const period = hour >= 12 ? 'PM' : 'AM';
        if (hour > 12) hour -= 12;
        if (hour === 0) hour = 12;
        return `${hour.toString().padStart(2, '0')}:${m} ${period}`;
    };

    // Helper to parse duration string "30 mins" -> {val: 30, unit: 'mins'}
    const parseDuration = (durStr: string) => {
        const match = durStr.match(/(\d+)\s*(mins|hours|hr|min)/i);
        if (!match) return { val: '', unit: 'mins' };
        return { val: match[1], unit: match[2].startsWith('h') ? 'hours' : 'mins' };
    };

    const startEdit = (item: RoutineItem) => {
        // If clicking the same item, cancel edit
        if (editingId === item.id) {
            cancelEdit();
            return;
        }

        const { val, unit } = parseDuration(item.duration);
        setEditForm({
            time: toInputTime(item.time),
            activity: item.activity,
            durationVal: val,
            durationUnit: unit,
            category: item.category,
        });
        setEditingId(item.id);
    };

    const startAdd = () => {
        const newId = Date.now().toString();
        const newItem: RoutineItem = {
            id: newId,
            time: '09:00 AM',
            activity: '',
            duration: '30 mins',
            category: 'Productivity',
        };
        // Add to top of list momentarily or bottom? Let's add top so user sees it.
        setItems([newItem, ...items]);

        // Immediately start editing
        setEditForm({
            time: '09:00',
            activity: '',
            durationVal: '30',
            durationUnit: 'mins',
            category: 'Productivity',
        });
        setEditingId(newId);
    };

    const cancelEdit = () => {
        // If it was a new item (empty activity), remove it
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

        const durationStr = `${editForm.durationVal} ${editForm.durationUnit}`;
        const timeStr = fromInputTime(editForm.time);

        const updatedItems = items.map(item => {
            if (item.id === editingId) {
                return {
                    ...item,
                    time: timeStr,
                    activity: editForm.activity,
                    duration: durationStr,
                    category: editForm.category
                };
            }
            return item;
        });

        // Auto sort by time
        updatedItems.sort((a, b) => {
            const timeA = parseTimeValue(a.time);
            const timeB = parseTimeValue(b.time);
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

    const parseTimeValue = (timeStr: string): number => {
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return 0;
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
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
                    <Button onClick={startAdd} size="sm" className="gap-1 rounded-xl">
                        <Plus className="w-4 h-4" />
                        Add
                    </Button>
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

                    if (isEditing) {
                        // Create temp item for validation
                        const tempItem: RoutineItem = {
                            id: item.id,
                            time: fromInputTime(editForm.time),
                            activity: editForm.activity,
                            duration: `${editForm.durationVal} ${editForm.durationUnit}`,
                            category: editForm.category
                        };

                        const isOverlap = items.some(other => other.id !== item.id && checkOverlap(tempItem, other));

                        return (
                            <div key={item.id} className={cn("bg-card border-2 rounded-3xl p-4 shadow-lg animate-in fade-in zoom-in-95 duration-200", isOverlap ? "border-destructive" : "border-primary/20")}>
                                <div className="space-y-4">
                                    {isOverlap && (
                                        <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-2 rounded-lg text-sm font-medium">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>This time overlaps with another schedule!</span>
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
                                                    value={editForm.time}
                                                    onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                                                    className="bg-background h-11 rounded-xl"
                                                />
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
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground ml-1">Duration</label>
                                        <div className="flex gap-2 mt-1.5">
                                            <Input
                                                type="number"
                                                value={editForm.durationVal}
                                                onChange={(e) => setEditForm({ ...editForm, durationVal: e.target.value })}
                                                placeholder="30"
                                                className="bg-background h-11 rounded-xl flex-1"
                                            />
                                            <Select
                                                value={editForm.durationUnit}
                                                onValueChange={(val) => setEditForm({ ...editForm, durationUnit: val })}
                                            >
                                                <SelectTrigger className="w-28 h-11 rounded-xl bg-background">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="mins">Mins</SelectItem>
                                                    <SelectItem value="hours">Hours</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
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

                    const isOverlap = items.some(other => other.id !== item.id && checkOverlap(item, other));

                    return (
                        <div
                            key={item.id}
                            onClick={() => startEdit(item)}
                            className={cn(
                                "group bg-card hover:bg-muted/50 transition-colors p-4 rounded-3xl border border-border/50 flex items-center gap-4 cursor-pointer active:scale-[0.98] duration-200",
                                isOverlap && "border-destructive/50 bg-destructive/5"
                            )}
                        >
                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary font-bold text-xs shrink-0">
                                <span>{item.time.split(' ')[0]}</span>
                                <span className="text-[10px] opacity-80">{item.time.split(' ')[1]}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground truncate">{item.activity}</h3>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span className="bg-muted px-2 py-0.5 rounded-full">{item.category}</span>
                                    <span>•</span>
                                    <span>{item.duration}</span>
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
        </div>
    );
};

export default EditSchedule;
