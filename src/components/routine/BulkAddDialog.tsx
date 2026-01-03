import { useState } from 'react';
import { X, Plus, Trash2, FileText, List, ArrowRight, Upload, PenLine } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface BulkAddDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (newItems: RoutineItem[]) => void;
}

const BulkAddDialog = ({ open, onClose, onSave }: BulkAddDialogProps) => {
    const [activeTab, setActiveTab] = useState('text');

    const [textInput, setTextInput] = useState('');
    const [parsedPreview, setParsedPreview] = useState<RoutineItem[]>([]);

    const [rows, setRows] = useState([
        { startTime: '', endTime: '', activity: '' },
        { startTime: '', endTime: '', activity: '' },
        { startTime: '', endTime: '', activity: '' },
    ]);

    const parseText = (text: string) => {
        const parsed = parseScheduleText(text);
        setParsedPreview(parsed);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextInput(e.target.value);
        parseText(e.target.value);
    };

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

    const handleSave = () => {
        const itemsToAdd: RoutineItem[] = [];

        if (activeTab === 'text') {
            if (parsedPreview.length === 0) {
                toast.error("Tidak ada item yang valid");
                return;
            }
            itemsToAdd.push(...parsedPreview.map(p => ({ ...p, id: Date.now() + Math.random().toString() })));
        } else {
            const validRows = rows.filter(r => r.startTime && r.endTime && r.activity);
            if (validRows.length === 0) {
                toast.error("Isi minimal satu item dengan lengkap");
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
        setTextInput('');
        setParsedPreview([]);
        setRows([{ startTime: '', endTime: '', activity: '' }, { startTime: '', endTime: '', activity: '' }]);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="font-handwriting text-xl text-ink flex items-center gap-2">
                        <PenLine className="w-5 h-5 text-doodle-primary" />
                        Import Jadwal 📋
                    </DialogTitle>
                    <DialogDescription className="font-handwriting text-pencil">
                        Tambahkan banyak item sekaligus dengan format "Mulai - Selesai".
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4 bg-paper-lines/20 rounded-sm p-1 h-12 border-2 border-dashed border-paper-lines/50">
                            <TabsTrigger
                                value="text"
                                className="rounded-sm font-handwriting data-[state=active]:bg-sticky-yellow data-[state=active]:shadow-tape data-[state=active]:text-ink"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Paste Teks
                            </TabsTrigger>
                            <TabsTrigger
                                value="manual"
                                className="rounded-sm font-handwriting data-[state=active]:bg-sticky-blue data-[state=active]:shadow-tape data-[state=active]:text-ink"
                            >
                                <List className="w-4 h-4 mr-2" />
                                Manual
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="text" className="space-y-4 data-[state=inactive]:hidden">
                            {/* AI Prompt Template */}
                            <div className="p-4 bg-sticky-green/20 rounded-sm border-2 border-dashed border-sticky-green/50">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-handwriting text-sm text-ink">✨ Template AI Prompt</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs px-2 font-handwriting text-doodle-primary hover:bg-doodle-primary/10 rounded-sm"
                                        onClick={() => {
                                            const template = `Please convert my schedule into this format strictly:\nHH:mm - HH:mm Activity Name [Category] (Description/Details)\n\nCategories options: Productivity, Mindfulness, Fitness, Nutrition, Learning, Spiritual.\n\nExample:\n06:00 - 06:30 Morning Run [Fitness] (3km jog around park)\n09:00 - 10:00 Deep Work [Productivity] (Finish Q1 Report)\n\nMy Schedule:\n[PASTE YOUR SCHEDULE HERE]`;
                                            navigator.clipboard.writeText(template);
                                            toast.success("Template disalin!");
                                        }}
                                    >
                                        Copy
                                    </Button>
                                </div>
                                <p className="font-handwriting text-xs text-pencil">
                                    Punya jadwal berantakan? Copy prompt ini ke ChatGPT untuk format otomatis.
                                </p>
                            </div>

                            {/* Format Example */}
                            <div className="p-4 bg-sticky-yellow/20 rounded-sm border-2 border-dashed border-sticky-yellow/50">
                                <p className="font-handwriting text-sm text-ink mb-2">📝 Contoh Format Manual:</p>
                                <p className="font-handwriting text-xs text-pencil italic space-y-1">
                                    <span className="block">06:00 - 06:30 Lari Pagi [Fitness] (3km)</span>
                                    <span className="block">12:30 - 13:30 Makan Siang | Catering sehat</span>
                                </p>
                            </div>

                            <Textarea
                                placeholder="Paste jadwal kamu di sini..."
                                variant="notebook"
                                className="min-h-[150px] font-handwriting resize-none"
                                value={textInput}
                                onChange={handleTextChange}
                            />

                            {parsedPreview.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-handwriting text-sm text-pencil">
                                        Preview ({parsedPreview.length} item) ✓
                                    </h4>
                                    <div className="space-y-2 bg-paper-lines/10 rounded-sm p-2 max-h-[200px] overflow-y-auto border-2 border-dashed border-paper-lines/50">
                                        {parsedPreview.map((item, i) => (
                                            <div key={i} className="flex flex-col gap-1 p-2 bg-card rounded-sm border-2 border-paper-lines/30">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1 font-handwriting text-xs text-doodle-primary shrink-0">
                                                        <span>{item.startTime}</span>
                                                        <span className='opacity-50'>-</span>
                                                        <span>{item.endTime}</span>
                                                    </div>
                                                    <span className="flex-1 font-handwriting text-sm text-ink truncate">{item.activity}</span>
                                                    {item.category && item.category !== 'Productivity' && (
                                                        <span className="font-handwriting text-xs px-1.5 py-0.5 rounded-sm bg-sticky-blue/50 text-ink">
                                                            {item.category}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="manual" className="space-y-4 data-[state=inactive]:hidden">
                            <div className="space-y-3">
                                {rows.map((row, i) => (
                                    <div key={i} className="flex gap-2 items-start p-3 bg-card rounded-sm border-2 border-paper-lines/30">
                                        <div className="grid gap-2 flex-1">
                                            <div className="flex gap-2 items-center">
                                                <Input
                                                    type="time"
                                                    className="w-24 rounded-sm font-handwriting text-xs border-2 border-dashed"
                                                    value={row.startTime}
                                                    onChange={(e) => updateRow(i, 'startTime', e.target.value)}
                                                />
                                                <ArrowRight className="w-4 h-4 text-pencil shrink-0" />
                                                <Input
                                                    type="time"
                                                    className="w-24 rounded-sm font-handwriting text-xs border-2 border-dashed"
                                                    value={row.endTime}
                                                    onChange={(e) => updateRow(i, 'endTime', e.target.value)}
                                                />
                                            </div>
                                            <Input
                                                placeholder="Nama aktivitas"
                                                variant="notebook"
                                                className="w-full font-handwriting"
                                                value={row.activity}
                                                onChange={(e) => updateRow(i, 'activity', e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-pencil hover:text-doodle-red shrink-0 mt-1 rounded-sm"
                                            onClick={() => removeRow(i)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                onClick={addRow}
                                className="w-full rounded-sm gap-2 font-handwriting border-2 border-dashed border-doodle-primary/40 text-doodle-primary hover:bg-doodle-primary/10"
                            >
                                <Plus className="w-4 h-4" /> Tambah Baris
                            </Button>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="p-4 border-t-2 border-dashed border-paper-lines bg-paper/50">
                    <Button
                        onClick={handleSave}
                        className="w-full h-12 rounded-sm gap-2 font-handwriting text-lg bg-doodle-primary hover:bg-doodle-primary/90 text-white shadow-notebook"
                    >
                        <Upload className="w-4 h-4" />
                        Import {activeTab === 'text' && parsedPreview.length > 0 ? `(${parsedPreview.length})` : ''} Item ✓
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BulkAddDialog;
