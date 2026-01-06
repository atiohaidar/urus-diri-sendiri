import { useLanguage } from '@/i18n/LanguageContext';

export const useTranslation = () => {
    const { t } = useLanguage();
    return { t };
};
