import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './locales/en';
import { id } from './locales/id';
import { Translation, Language } from './types';

import { STORAGE_KEYS } from '@/lib/constants';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translation;
    toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        // Check localStorage
        const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
        if (saved === 'en' || saved === 'id') return saved;
        // No saved preference, use ID as default for Indonesian user
        return 'id';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
        // Update html lang attribute for accessibility
        document.documentElement.lang = lang;
    };

    const toggleLanguage = () => {
        setLanguage(language === 'id' ? 'en' : 'id');
    };

    // Sync with document on mount
    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const t = language === 'en' ? en : id;

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
