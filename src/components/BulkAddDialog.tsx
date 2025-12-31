import { useState } from 'react';
import { X, Plus, Trash2, FileText, List, ArrowRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseDurationToMinutes, type RoutineItem } from '@/lib/storage';
import { toast } from 'sonner';

interface BulkAddDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (newItems: RoutineItem[]) => void;
}

const BulkAddDialog = ({ open, onClose, onSave }: BulkAddDialogProps) => {
    const [activeTab, setActiveTab] = useState('text');

    // Text Mode State
    const [textInput, setTextInput] = useState('');
    const [parsedPreview, setParsedPreview] = useState<RoutineItem[]>([]);

    // Manual Mode State
    const [rows, setRows] = useState([
        { time: '', activity: '', duration: '' },
        { time: '', activity: '', duration: '' },
        { time: '', activity: '', duration: '' },
    ]);

    // --- TEXT PARSING LOGIC ---
    const parseText = (text: string) => {
        const lines = text.split('\n').filter(l => l.trim());
        const parsed: RoutineItem[] = [];

        lines.forEach((line, i) => {
            // Very basic regex to catch common formats like:
            // "06:00 Morning Run 30 mins"
            // "8am Breakfast"
            // "19:00 - Dinner (1 hour)"

            // 1. Try to find time at start
            const timeMatch = line.match(/^(\d{1,2}[:.]\d{2}|\d{1,2})\s*(am|pm)?/i);

            if (timeMatch) {
                let timeStr = timeMatch[0];
                let content = line.substring(timeStr.length).trim();

                // Normalize time
                if (!timeStr.includes(':') && !timeStr.includes('.')) {
                    timeStr += ":00";
                }
                timeStr = timeStr.replace('.', ':');
                // Add AM/PM if missing (dumb guess: if < 5 assume PM? No, let's default to AM unless explicitly PM or > 12)
                if (!timeStr.match(/am|pm/i)) {
                    const hour = parseInt(timeStr.split(':')[0]);
                    if (hour < 6) timeStr += " PM"; // Assume 1-5 without suffix is PM? Or user must specify. Let's assume 24h or AM.
                    else if (hour > 12) {
                        // 24h format
                        const h = hour - 12;
                        timeStr = `${h}:${timeStr.split(':')[1]} PM`;
                    } else {
                        timeStr += " AM";
                    }
                } else {
                    // ensure space
                    timeStr = timeStr.replace(/(\d)(am|pm)/i, '$1 $2').toUpperCase();
                }

                // 2. Try to find duration
                let duration = "30 mins"; // default
                const durMatch = content.match(/(\d+)\s*(m|min|mins|minute|minutes|h|hr|hour|hours)/i);

                if (durMatch) {
                    const val = durMatch[1];
                    const unit = durMatch[2].startsWith('h') ? 'hours' : 'mins';
                    duration = `${val} ${unit}`;
                    // Remove duration from content if it's there
                    // content = content.replace(durMatch[0], '').trim(); // Risky if it removes part of activity
                }

                // 3. Activity is what remains (cleanup typical chars)
                let activity = content
                    .replace(/^[-–: ]+/, '') // remove leading separator
                    .replace(/\(.*\)$/, '') // remove brackets at end (often duration)
                    .trim();

                if (parsed.length > 0 && !activity) return; // Skip if empty?

                parsed.push({
                    id: `preview-${i}`,
                    time: timeStr.toUpperCase(),
                    activity: activity || "New Item",
                    duration: duration,
                    category: 'Productivity' // Default
                });
            }
        });

        setParsedPreview(parsed);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextInput(e.target.value);
        parseText(e.target.value);
    };

    // --- MANUAL ROW LOGIC ---
    const addRow = () => {
        setRows([...rows, { time: '', activity: '', duration: '' }]);
    };

    const removeRow = (index: number) => {
        setRows(rows.filter((_, i) => i !== index));
    };

    const updateRow = (index: number, field: string, value: string) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    // --- SAVE ---
    const handleSave = () => {
        const itemsToAdd: RoutineItem[] = [];

        if (activeTab === 'text') {
            if (parsedPreview.length === 0) {
                toast.error("No valid items found in text");
                return;
            }
            itemsToAdd.push(...parsedPreview.map(p => ({ ...p, id: Date.now() + Math.random().toString() })));
        } else {
            // Manual items
            const validRows = rows.filter(r => r.time && r.activity);
            if (validRows.length === 0) {
                toast.error("Please fill in at least one item");
                return;
            }
            itemsToAdd.push(...validRows.map((r, i) => ({
                id: Date.now() + i.toString(),
                time: r.time, // Needs formatting validation? Assuming user inputs correctly for now or we add validator
                activity: r.activity,
                duration: r.duration || "30 mins",
                category: 'Productivity'
            })));
        }

        onSave(itemsToAdd);
        onClose();
        // Reset
        setTextInput('');
        setParsedPreview([]);
        setRows([{ time: '', activity: '', duration: '' }, { time: '', activity: '', duration: '' }]);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col rounded-3xl overflow-hidden p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Bulk Add Items</DialogTitle>
                    <DialogDescription>
                        Add multiple schedule items at once.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 rounded-xl p-1 h-12">
                            <TabsTrigger value="text" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <FileText className="w-4 h-4 mr-2" />
                                Paste Text
                            </TabsTrigger>
                            <TabsTrigger value="manual" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <List className="w-4 h-4 mr-2" />
                                Manual List
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="text" className="space-y-4 data-[state=inactive]:hidden">
                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <p className="text-xs text-muted-foreground mb-2 font-medium">✨ Try pasting like this:</p>
                                <p className="text-xs text-muted-foreground/80 italic">
                                    06:00 AM Morning Run (30 mins)<br />
                                    12:30 PM Lunch Break<br />
                                    19:00 Reading Book 1 hour
                                </p>
                            </div>

                            <Textarea
                                placeholder="Paste your schedule here..."
                                className="min-h-[150px] rounded-xl font-mono text-sm resize-none focus-visible:ring-primary"
                                value={textInput}
                                onChange={handleTextChange}
                            />

                            {parsedPreview.length > 0 && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview ({parsedPreview.length} items)</h4>
                                    <div className="space-y-2 bg-muted/30 rounded-2xl p-2">
                                        {parsedPreview.map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 p-2 bg-background rounded-xl border border-border/50 text-sm">
                                                <span className="font-mono font-medium text-primary shrink-0">{item.time}</span>
                                                <span className="flex-1 truncate">{item.activity}</span>
                                                <span className="text-muted-foreground text-xs">{item.duration}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="manual" className="space-y-4 data-[state=inactive]:hidden">
                            <div className="space-y-3">
                                {rows.map((row, i) => (
                                    <div key={i} className="flex gap-2 items-start animate-fade-in">
                                        <div className="grid gap-2 flex-1">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="08:00 AM"
                                                    className="w-24 rounded-xl"
                                                    value={row.time}
                                                    onChange={(e) => updateRow(i, 'time', e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Activity name"
                                                    className="flex-1 rounded-xl"
                                                    value={row.activity}
                                                    onChange={(e) => updateRow(i, 'activity', e.target.value)}
                                                />
                                            </div>
                                            <Input
                                                placeholder="Duration (e.g. 30 mins)"
                                                className="rounded-xl h-8 text-xs"
                                                value={row.duration}
                                                onChange={(e) => updateRow(i, 'duration', e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive shrink-0"
                                            onClick={() => removeRow(i)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" onClick={addRow} className="w-full rounded-xl gap-2 border-dashed">
                                <Plus className="w-4 h-4" /> Add Another Row
                            </Button>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="p-4 border-t bg-muted/20">
                    <Button onClick={handleSave} className="w-full h-12 rounded-xl gap-2 text-base">
                        <Upload className="w-4 h-4" />
                        Import {activeTab === 'text' && parsedPreview.length > 0 ? `(${parsedPreview.length})` : ''} Items
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BulkAddDialog;
