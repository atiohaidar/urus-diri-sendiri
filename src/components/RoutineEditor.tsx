import { useState } from 'react';
import { Plus, Pencil, Trash2, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RoutineItem } from '@/lib/storage';
import { toast } from 'sonner';

interface RoutineEditorProps {
  open: boolean;
  onClose: () => void;
  routines: RoutineItem[];
  onSave: (routines: RoutineItem[]) => void;
}

const CATEGORIES = [
  'Mindfulness',
  'Fitness',
  'Nutrition',
  'Productivity',
  'Spiritual',
  'Learning',
];

const RoutineEditor = ({ open, onClose, routines, onSave }: RoutineEditorProps) => {
  const [items, setItems] = useState<RoutineItem[]>(routines);
  const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [time, setTime] = useState('');
  const [activity, setActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('');

  const resetForm = () => {
    setTime('');
    setActivity('');
    setDuration('');
    setCategory('');
    setEditingItem(null);
    setIsAdding(false);
  };

  const startEdit = (item: RoutineItem) => {
    setEditingItem(item);
    setTime(item.time);
    setActivity(item.activity);
    setDuration(item.duration);
    setCategory(item.category);
    setIsAdding(false);
  };

  const startAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleSaveItem = () => {
    if (!time.trim() || !activity.trim() || !duration.trim() || !category) {
      toast.error('Please fill all fields');
      return;
    }

    if (editingItem) {
      // Update existing
      const updated = items.map(item =>
        item.id === editingItem.id
          ? { ...item, time, activity, duration, category }
          : item
      );
      setItems(updated);
    } else {
      // Add new
      const newItem: RoutineItem = {
        id: Date.now().toString(),
        time,
        activity,
        duration,
        category,
      };
      setItems([...items, newItem]);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    if (editingItem?.id === id) {
      resetForm();
    }
  };

  const handleSaveAll = () => {
    // Sort by time before saving
    const sorted = [...items].sort((a, b) => {
      const timeA = parseTime(a.time);
      const timeB = parseTime(b.time);
      return timeA - timeB;
    });
    onSave(sorted);
    toast.success('Schedule updated');
    onClose();
  };

  const parseTime = (timeStr: string): number => {
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col rounded-3xl">
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
          <DialogDescription>
            Add, edit, or remove your daily routine items.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-2 p-3 rounded-2xl border transition-colors ${
                editingItem?.id === item.id
                  ? 'bg-primary/10 border-primary'
                  : 'bg-muted/50 border-transparent'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{item.activity}</p>
                <p className="text-xs text-muted-foreground">
                  {item.time} • {item.duration}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => startEdit(item)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No routines yet. Add your first one!
            </p>
          )}
        </div>

        {/* Add/Edit Form */}
        {(isAdding || editingItem) && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {editingItem ? 'Edit Item' : 'New Item'}
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Time (e.g., 06:00 AM)"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-xl"
              />
              <Input
                placeholder="Duration (e.g., 30 mins)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Input
              placeholder="Activity name"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="rounded-xl"
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSaveItem} className="w-full rounded-xl">
              {editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="border-t pt-4 flex gap-2">
          {!isAdding && !editingItem && (
            <Button
              variant="outline"
              onClick={startAdd}
              className="flex-1 rounded-xl gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          )}
          <Button onClick={handleSaveAll} className="flex-1 rounded-xl">
            Save Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoutineEditor;
