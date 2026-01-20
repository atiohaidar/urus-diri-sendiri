import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus, Clock, Trash2, Save, GripVertical, AlertTriangle, ArrowRight, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimePicker } from '@/components/ui/time-picker';
import { ScheduleCard } from '@/components/routine/ScheduleCard';
import { ScheduleForm } from '@/components/routine/ScheduleForm';
import { getRoutines, saveRoutines, deleteRoutine, checkOverlap, parseTimeToMinutes, initializeStorage, type RoutineItem } from '@/lib/storage';
import { toast } from 'sonner';
import BulkAddDialog from '@/components/routine/BulkAddDialog';
import MainLayout from '@/components/layout/MainLayout';


const EditSchedule = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<RoutineItem[]>([]);
    const [showBulkAdd, setShowBulkAdd] = useState(false);

    // Edit Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{
        startTime: string;
        endTime: string;
        activity: string;
        category: string;
        description?: string;
    }>({
        startTime: '',
        endTime: '',
        activity: '',
        category: '',
        description: '',
    });

    useEffect(() => {
        initializeStorage().then(() => {
            setItems(getRoutines());
        });
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
            description: item.description || '',
        });
        setEditingId(item.id);
    };

    const startAdd = () => {
        const newId = Date.now().toString();
        const newItem: RoutineItem = {
            id: newId,
            startTime: '09:00',
            endTime: '09:30',
            activity: '',
            category: 'Productivity',
        };

        setItems([newItem, ...items]);

        setEditForm({
            startTime: '09:00',
            endTime: '09:30',
            activity: '',
            category: 'Productivity',
            description: '',
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
                    category: editForm.category,
                    description: editForm.description,
                };
            }
            return item;
        });

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
        deleteRoutine(id);
        setItems(prev => prev.filter(i => i.id !== id));
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
        <MainLayout showMobileHeader={false} className="pt-0 md:pt-4 md:px-8 max-w-7xl bg-notebook">
            {/* Header - Notebook style */}
            <div className="sticky top-0 z-40 bg-paper border-b-2 border-dashed border-paper-lines -mx-4 px-4 py-4 mb-6 md:mx-0 md:px-0 md:bg-transparent md:border-0 md:static md:mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="-ml-2 md:hidden rounded-sm bg-sticky-yellow shadow-tape -rotate-3"
                        >
                            <ArrowLeft className="w-5 h-5 text-ink" />
                        </Button>
                        <h1 className="font-handwriting text-xl md:text-2xl text-ink">Edit Jadwal 📝</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setShowBulkAdd(true)}
                            variant="outline"
                            size="sm"
                            className="gap-1 rounded-sm font-handwriting border-2 border-dashed border-pencil/40"
                        >
                            <GripVertical className="w-4 h-4" />
                            <span className="hidden sm:inline">Import</span>
                        </Button>
                        <Button
                            onClick={startAdd}
                            size="sm"
                            className="gap-1 rounded-sm font-handwriting bg-doodle-primary hover:bg-doodle-primary/90 shadow-notebook"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah
                        </Button>
                    </div>
                </div>
            </div>

            {items.length === 0 && (
                <div className="text-center py-20 mx-auto max-w-md">
                    <div className="w-16 h-16 bg-sticky-yellow shadow-sticky rounded-sm flex items-center justify-center mx-auto mb-4 rotate-3">
                        <PenLine className="w-8 h-8 text-ink" />
                    </div>
                    <p className="font-handwriting text-lg text-ink mb-1">Belum ada rutinitas 📋</p>
                    <p className="font-handwriting text-sm text-pencil">Mulai dengan menambahkan satu!</p>
                </div>
            )}

            <div className={cn(
                items.length > 0 && "grid grid-cols-1 md:grid-cols-2 gap-4 pb-10"
            )}>
                {items.map((item) => {
                    const isEditing = editingId === item.id;

                    const checkItem = isEditing ? {
                        ...item,
                        startTime: editForm.startTime,
                        endTime: editForm.endTime,
                    } : item;

                    const isOverlap = items.some(other => other.id !== item.id && checkOverlap(checkItem, other));

                    if (isEditing) {
                        return (
                            <ScheduleForm
                                key={item.id}
                                editForm={editForm}
                                isOverlap={isOverlap}
                                onFormChange={(updates) => setEditForm(prev => ({ ...prev, ...updates }))}
                                onSave={saveItem}
                                onCancel={cancelEdit}
                            />
                        );
                    }

                    return (
                        <ScheduleCard
                            key={item.id}
                            item={item}
                            isOverlap={isOverlap}
                            onEdit={startEdit}
                            onDelete={deleteItem}
                        />
                    );
                })}
            </div>

            {/* Bulk Add Dialog */}
            <BulkAddDialog
                open={showBulkAdd}
                onClose={() => setShowBulkAdd(false)}
                onSave={handleBulkSave}
            />
        </MainLayout>
    );

};

export default EditSchedule;
