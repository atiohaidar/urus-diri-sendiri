import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageContext';
import { usePersonalNotes } from '@/hooks/usePersonalNotes';

export const PersonalNotesSection = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    // Removed isSetup from hook to avoid triggering API call on Settings mount
    usePersonalNotes();

    return (
        <Card className="glass-panel overflow-hidden">
            <CardHeader className="border-b border-border/10 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-sm bg-sticky-yellow shadow-sticky -rotate-2">
                        <Lock className="w-5 h-5 text-ink" />
                    </div>
                    <div>
                        <CardTitle className="font-handwriting text-xl text-ink">
                            {t.personal_notes.title}
                        </CardTitle>
                        <CardDescription className="font-handwriting text-pencil">
                            {t.personal_notes.description}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <Button
                    variant="outline"
                    className="w-full justify-between font-handwriting h-12"
                    onClick={() => navigate('/personal-notes')}
                >
                    <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4 mr-2" />
                        {t.personal_notes.title}
                    </span>
                </Button>
            </CardContent>
        </Card>
    );
};
