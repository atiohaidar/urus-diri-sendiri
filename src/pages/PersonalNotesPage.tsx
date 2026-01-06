import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, LockOpen, Plus, Copy, Edit, Trash2, Key, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import MainLayout from '@/components/layout/MainLayout';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { usePersonalNotes } from '@/hooks/usePersonalNotes';
import { SetupPersonalNotesDialog } from '@/components/SetupPersonalNotesDialog';
import { PersonalNoteEntryDialog } from '@/components/PersonalNoteEntryDialog';
import { PersonalNoteEntry } from '@/lib/types';

const PersonalNotesPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const {
        isSetup,
        isUnlocked,
        entries,
        isLoading,
        setupPassword,
        unlock,
        lock,
        addEntry,
        updateEntry,
        deleteEntry,
        changePassword,
        resetAll,
    } = usePersonalNotes(true);

    // Dialog states
    const [showSetupDialog, setShowSetupDialog] = useState(false);
    const [showEntryDialog, setShowEntryDialog] = useState(false);
    const [showUnlockDialog, setShowUnlockDialog] = useState(false); // Meskipun tidak dipakai di UI unlock, bisa berguna
    const [showDeleteEntryDialog, setShowDeleteEntryDialog] = useState(false);
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
    const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);

    // Form states
    const [unlockPassword, setUnlockPassword] = useState('');
    const [unlockError, setUnlockError] = useState('');
    const [editingEntry, setEditingEntry] = useState<PersonalNoteEntry | null>(null);
    const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

    // Change password states
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [changePasswordError, setChangePasswordError] = useState('');

    const handleSetup = async (password: string) => {
        try {
            await setupPassword(password);
            toast.success(t.personal_notes.setup_success);
        } catch (error) {
            toast.error('Failed to setup personal notes');
        }
    };

    const handleUnlock = async () => {
        try {
            setUnlockError('');
            await unlock(unlockPassword);
            setUnlockPassword('');
            // setShowUnlockDialog(false); // Tidak perlu karena unlock form ada di page
            toast.success('Unlocked successfully');
        } catch (error) {
            setUnlockError(t.personal_notes.unlock_error);
        }
    };

    const handleLock = () => {
        lock();
        toast.success('Locked successfully');
    };

    const handleAddEntry = async (label: string, value: string) => {
        try {
            await addEntry(label, value);
            toast.success(t.personal_notes.entry_added);
        } catch (error) {
            toast.error('Failed to add entry');
        }
    };

    const handleUpdateEntry = async (label: string, value: string) => {
        if (!editingEntry) return;
        try {
            await updateEntry(editingEntry.id, label, value);
            toast.success(t.personal_notes.entry_updated);
            setEditingEntry(null);
        } catch (error) {
            toast.error('Failed to update entry');
        }
    };

    const handleDeleteEntry = async () => {
        if (!deletingEntryId) return;
        try {
            await deleteEntry(deletingEntryId);
            toast.success(t.personal_notes.entry_deleted);
            setDeletingEntryId(null);
            setShowDeleteEntryDialog(false);
        } catch (error) {
            toast.error('Failed to delete entry');
        }
    };

    const handleCopy = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(t.personal_notes.copied);
        } catch (error) {
            toast.error('Failed to copy');
        }
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 8) {
            setChangePasswordError('Password minimal 8 karakter');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setChangePasswordError(t.note_editor.passwords_dont_match);
            return;
        }

        try {
            await changePassword(oldPassword, newPassword);
            toast.success(t.personal_notes.password_changed);
            setShowChangePasswordDialog(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setChangePasswordError('');
        } catch (error) {
            setChangePasswordError(t.personal_notes.unlock_error);
        }
    };

    const handleDeleteAll = () => {
        resetAll();
        toast.success(t.personal_notes.all_deleted);
        setShowDeleteAllDialog(false);
    };

    if (isLoading) {
        return (
            <MainLayout showMobileHeader={false} className="pt-0 md:pt-0">
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">{t.common.loading}</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout showMobileHeader={false} className="pt-0 md:pt-0">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 -mx-4 px-4 py-4 mb-6 md:-mx-4 md:px-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">{t.personal_notes.title}</h1>
                            <p className="text-xs text-muted-foreground">{t.personal_notes.description}</p>
                        </div>
                    </div>
                    {isUnlocked && (
                        <Button variant="outline" size="sm" onClick={handleLock}>
                            <Lock className="w-4 h-4 mr-2" />
                            {t.personal_notes.lock_button}
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {/* State 1: Not Setup */}
                {!isSetup && (
                    <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-sm text-center space-y-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold mb-2">{t.personal_notes.setup_title}</h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t.personal_notes.setup_description}
                            </p>
                        </div>
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-left">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-destructive">
                                    {t.personal_notes.setup_warning}
                                </p>
                            </div>
                        </div>
                        <Button onClick={() => setShowSetupDialog(true)} size="lg">
                            <Lock className="w-4 h-4 mr-2" />
                            {t.personal_notes.setup_button}
                        </Button>
                    </div>
                )}

                {/* State 2: Locked */}
                {isSetup && !isUnlocked && (
                    <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-sm text-center space-y-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <LockOpen className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold mb-2">{t.personal_notes.unlock_title}</h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t.personal_notes.unlock_description}
                            </p>
                        </div>
                        <div className="max-w-sm mx-auto space-y-3">
                            <Input
                                type="password"
                                value={unlockPassword}
                                onChange={(e) => {
                                    setUnlockPassword(e.target.value);
                                    setUnlockError('');
                                }}
                                placeholder={t.note_editor.enter_password}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUnlock();
                                }}
                            />
                            {unlockError && (
                                <p className="text-sm text-destructive">{unlockError}</p>
                            )}
                            <Button onClick={handleUnlock} className="w-full">
                                <LockOpen className="w-4 h-4 mr-2" />
                                {t.personal_notes.unlock_button}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                {t.personal_notes.forgot_password_warning}
                            </p>
                        </div>
                    </div>
                )}

                {/* State 3: Unlocked */}
                {isUnlocked && (
                    <>
                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button onClick={() => setShowEntryDialog(true)} className="flex-1">
                                <Plus className="w-4 h-4 mr-2" />
                                {t.personal_notes.add_entry}
                            </Button>
                            <Button variant="outline" onClick={() => setShowChangePasswordDialog(true)}>
                                <Key className="w-4 h-4 mr-2" />
                                {t.personal_notes.change_password_button}
                            </Button>
                        </div>

                        {/* Entries Table */}
                        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
                            {entries.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    {t.personal_notes.no_entries}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50 border-b border-border/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                                    {t.personal_notes.table_label}
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                                    {t.personal_notes.table_value}
                                                </th>
                                                <th className="px-4 py-3 text-right text-sm font-semibold">
                                                    {t.personal_notes.table_actions}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entries.map((entry) => (
                                                <tr key={entry.id} className="border-b border-border/30 last:border-0">
                                                    <td className="px-4 py-3 font-medium">{entry.label}</td>
                                                    <td className="px-4 py-3 font-mono text-sm whitespace-pre-wrap break-all">
                                                        {entry.value}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleCopy(entry.value)}
                                                                title={t.personal_notes.copy_button}
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setEditingEntry(entry);
                                                                    setShowEntryDialog(true);
                                                                }}
                                                                title={t.common.edit}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setDeletingEntryId(entry.id);
                                                                    setShowDeleteEntryDialog(true);
                                                                }}
                                                                title={t.common.delete}
                                                            >
                                                                <Trash2 className="w-4 h-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-destructive/5 rounded-3xl p-6 border border-destructive/20">
                            <h3 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                {t.personal_notes.delete_all_desc}
                            </p>
                            <Button variant="destructive" onClick={() => setShowDeleteAllDialog(true)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t.personal_notes.delete_all_button}
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {/* Dialogs */}
            <SetupPersonalNotesDialog
                open={showSetupDialog}
                onClose={() => setShowSetupDialog(false)}
                onConfirm={handleSetup}
            />

            <PersonalNoteEntryDialog
                open={showEntryDialog}
                onClose={() => {
                    setShowEntryDialog(false);
                    setEditingEntry(null);
                }}
                onSave={editingEntry ? handleUpdateEntry : handleAddEntry}
                initialLabel={editingEntry?.label}
                initialValue={editingEntry?.value}
                isEdit={!!editingEntry}
            />

            {/* Delete Entry Dialog */}
            <AlertDialog open={showDeleteEntryDialog} onOpenChange={setShowDeleteEntryDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t.personal_notes.delete_entry_title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t.personal_notes.delete_entry_desc}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteEntry}>
                            {t.common.delete}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete All Dialog */}
            <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t.personal_notes.delete_all_title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t.personal_notes.delete_all_desc}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground">
                            {t.common.delete}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Change Password Dialog */}
            <AlertDialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t.personal_notes.change_password_button}</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Old Password</label>
                            <Input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => {
                                    setOldPassword(e.target.value);
                                    setChangePasswordError('');
                                }}
                                placeholder="Enter old password"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    setChangePasswordError('');
                                }}
                                placeholder={t.note_editor.password_placeholder}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.note_editor.confirm_password}</label>
                            <Input
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => {
                                    setConfirmNewPassword(e.target.value);
                                    setChangePasswordError('');
                                }}
                                placeholder={t.note_editor.confirm_password}
                            />
                        </div>
                        {changePasswordError && (
                            <p className="text-sm text-destructive">{changePasswordError}</p>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setOldPassword('');
                            setNewPassword('');
                            setConfirmNewPassword('');
                            setChangePasswordError('');
                        }}>
                            {t.common.cancel}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleChangePassword}>
                            {t.common.save}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </MainLayout>
    );
};

export default PersonalNotesPage;
