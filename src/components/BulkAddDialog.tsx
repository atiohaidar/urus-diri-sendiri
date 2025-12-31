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
import { type RoutineItem, calculateDuration, parseScheduleText } from '@/lib/storage';
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
        { startTime: '', endTime: '', activity: '' },
        { startTime: '', endTime: '', activity: '' },
        { startTime: '', endTime: '', activity: '' },
    ]);

    // --- TEXT PARSING LOGIC ---
    // --- TEXT PARSING LOGIC ---
    const parseText = (text: string) => {
        const parsed = parseScheduleText(text);
        setParsedPreview(parsed);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextInput(e.target.value);
        parseText(e.target.value);
    };

    // --- MANUAL ROW LOGIC ---
    const addRow = () => {
        setRows([...rows, { startTime: '', endTime: '', activity: '' }]);
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
            const validRows = rows.filter(r => r.startTime && r.endTime && r.activity);
            if (validRows.length === 0) {
                toast.error("Please fill in at least one item completely");
                return;
            }
            itemsToAdd.push(...validRows.map((r, i) => ({
                id: Date.now() + i.toString(),
                startTime: r.startTime,
                endTime: r.endTime,
                activity: r.activity,
                category: 'Productivity'
            })));
        }

        onSave(itemsToAdd);
        onClose();
        // Reset
        setTextInput('');
        setParsedPreview([]);
        setRows([{ startTime: '', endTime: '', activity: '' }, { startTime: '', endTime: '', activity: '' }]);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col rounded-3xl overflow-hidden p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Bulk Add Items</DialogTitle>
                    <DialogDescription>
                        Add multiple items using "Start - End" format.
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
                                    06:00 - 06:30 Morning Run<br />
                                    12:30 PM - 01:30 PM Lunch<br />
                                    19:00 - 20:00 Reading
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
                                                <div className="flex flex-col text-[10px] font-mono font-medium text-primary shrink-0 leading-tight text-center">
                                                    <span>{item.startTime}</span>
                                                    <span className='opacity-50'>|</span>
                                                    <span>{item.endTime}</span>
                                                </div>
                                                <span className="flex-1 truncate">{item.activity}</span>
                                                <span className="text-muted-foreground text-xs">{calculateDuration(item.startTime, item.endTime)}</span>
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
                                                    type="time"
                                                    className="w-24 rounded-xl text-xs"
                                                    value={row.startTime}
                                                    onChange={(e) => updateRow(i, 'startTime', e.target.value)}
                                                />
                                                <ArrowRight className="w-4 h-4 text-muted-foreground self-center shrink-0" />
                                                <Input
                                                    type="time"
                                                    className="w-24 rounded-xl text-xs"
                                                    value={row.endTime}
                                                    onChange={(e) => updateRow(i, 'endTime', e.target.value)}
                                                />
                                            </div>
                                            <Input
                                                placeholder="Activity name"
                                                className="w-full rounded-xl"
                                                value={row.activity}
                                                onChange={(e) => updateRow(i, 'activity', e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive shrink-0 mt-1"
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
