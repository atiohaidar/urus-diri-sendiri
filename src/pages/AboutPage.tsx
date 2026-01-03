import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Github, Linkedin, Heart, Sparkles, Rocket, Coffee, ShieldCheck, Monitor, Atom, FileCode2, Palette, Layers, Zap, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

const AboutPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const techStack = [
        { label: "React", icon: <Atom className="w-4 h-4 text-sky-500" /> },
        { label: "Capacitor", icon: <Zap className="w-4 h-4 text-blue-400" /> },
        { label: "Radix UI", icon: <Layers className="w-4 h-4 text-violet-500" /> },
        { label: "Tailwind", icon: <Palette className="w-4 h-4 text-cyan-400" /> },
        { label: "TanStack Query", icon: <Rocket className="w-4 h-4 text-rose-500" /> },
        { label: "Framer Motion", icon: <Sparkles className="w-4 h-4 text-purple-500" /> },
        { label: "Recharts", icon: <Monitor className="w-4 h-4 text-indigo-500" /> },
        { label: "Lucide Icons", icon: <Heart className="w-4 h-4 text-pink-500" /> },
    ];

    const socialLinks = [
        {
            icon: <Github className="w-5 h-5" />,
            label: t.about.github_label,
            href: "https://github.com/atiohaidar/urus-diri-sendiri",
            color: "bg-sticky-blue",
        },
        {
            icon: <Linkedin className="w-5 h-5" />,
            label: t.about.linkedin_label,
            href: "https://linkedin.com/in/atiohaidar",
            color: "bg-sticky-green",
        },
    ];

    return (
        <div className="min-h-screen bg-notebook pb-12">
            {/* Hero Header - Notebook style */}
            <div className="relative h-64 md:h-80 border-b-2 border-dashed border-paper-lines overflow-hidden">
                {/* Paper texture background */}
                <div className="absolute inset-0 bg-paper" />

                {/* Decorative margin line */}
                <div className="absolute left-12 md:left-16 top-0 bottom-0 w-0.5 bg-paper-margin opacity-50" />

                <div className="container max-w-4xl mx-auto px-4 py-6 relative h-full flex flex-col justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-sm bg-sticky-yellow shadow-tape -rotate-3"
                    >
                        <ArrowLeft className="w-5 h-5 text-ink" />
                    </Button>

                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-sticky-pink text-ink text-xs font-handwriting mb-3 shadow-tape rotate-2">
                            <Sparkles className="w-3 h-3" />
                            <span>v1.0.0</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-handwriting text-ink">
                            UrusDiri<span className="text-doodle-primary">Sendiri</span> 📝
                        </h1>
                    </div>
                </div>

                {/* Decorative doodles */}
                <div className="absolute top-10 right-10 opacity-20">
                    <div className="w-24 h-24 border-4 border-dashed border-doodle-primary rounded-full" />
                </div>
            </div>

            <main className="container max-w-4xl mx-auto px-4 -mt-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* About Section - Notebook paper style */}
                        <section className="bg-card rounded-sm p-8 border-2 border-paper-lines/50 shadow-notebook">
                            <h2 className="font-handwriting text-2xl text-ink mb-4 flex items-center gap-2">
                                <Rocket className="w-6 h-6 text-doodle-primary" />
                                {t.about.title}
                            </h2>
                            <p className="font-handwriting text-lg text-ink leading-relaxed mb-6">
                                {t.about.description}
                            </p>

                            <div className="p-6 rounded-sm bg-sticky-yellow/20 border-2 border-dashed border-sticky-yellow/50">
                                <h3 className="font-handwriting text-lg text-ink mb-2 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-doodle-green" />
                                    {t.about.mission_title}
                                </h3>
                                <p className="font-handwriting text-base text-pencil">
                                    {t.about.mission_content}
                                </p>
                            </div>
                        </section>

                        {/* Workflow Section */}
                        <section className="bg-card rounded-sm p-8 border-2 border-paper-lines/50 shadow-notebook overflow-hidden relative">
                            <h2 className="font-handwriting text-2xl text-ink mb-6 flex items-center gap-2 relative z-10">
                                <PenLine className="w-6 h-6 text-doodle-primary" />
                                {t.about.workflow_title}
                            </h2>

                            <div className="space-y-6 relative z-10 border-l-2 border-dashed border-paper-lines pl-6">
                                {/* Step 1 */}
                                <div className="flex gap-4">
                                    <div className="absolute -left-3 w-6 h-6 rounded-full border-2 border-dashed border-doodle-primary bg-paper flex items-center justify-center text-doodle-primary font-handwriting text-sm">1</div>
                                    <div>
                                        <a href="https://stitch.withgoogle.com/" target="_blank" rel="noopener noreferrer" className="font-handwriting text-lg text-ink hover:text-doodle-primary transition-colors flex items-center gap-2">
                                            Stitch <Globe className="w-3 h-3" />
                                        </a>
                                        <p className="font-handwriting text-sm text-pencil mt-1">
                                            {t.about.workflow_design}
                                        </p>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex gap-4 pt-4">
                                    <div className="absolute -left-3 w-6 h-6 rounded-full border-2 border-dashed border-doodle-primary bg-paper flex items-center justify-center text-doodle-primary font-handwriting text-sm">2</div>
                                    <div>
                                        <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="font-handwriting text-lg text-ink hover:text-doodle-primary transition-colors flex items-center gap-2">
                                            AI Studio <Sparkles className="w-3 h-3" />
                                        </a>
                                        <p className="font-handwriting text-sm text-pencil mt-1">
                                            {t.about.workflow_prompts}
                                        </p>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex gap-4 pt-4">
                                    <div className="absolute -left-3 w-6 h-6 rounded-full border-2 border-dashed border-doodle-primary bg-paper flex items-center justify-center text-doodle-primary font-handwriting text-sm">3</div>
                                    <div>
                                        <a href="https://lovable.dev/" target="_blank" rel="noopener noreferrer" className="font-handwriting text-lg text-ink hover:text-doodle-primary transition-colors flex items-center gap-2">
                                            Lovable <Monitor className="w-3 h-3" />
                                        </a>
                                        <p className="font-handwriting text-sm text-pencil mt-1">
                                            {t.about.workflow_frontend}
                                        </p>
                                    </div>
                                </div>

                                {/* Step 4 */}
                                <div className="flex gap-4 pt-4">
                                    <div className="absolute -left-3 w-6 h-6 rounded-full bg-doodle-primary flex items-center justify-center text-white font-handwriting text-sm shadow-notebook">4</div>
                                    <div>
                                        <a href="https://antigravity.google/" target="_blank" rel="noopener noreferrer" className="font-handwriting text-lg text-ink hover:text-doodle-primary transition-colors flex items-center gap-2">
                                            Antigravity <Rocket className="w-3 h-3" />
                                        </a>
                                        <p className="font-handwriting text-sm text-pencil mt-1">
                                            {t.about.workflow_refinement}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Credits Section */}
                        <section className="bg-card rounded-sm p-8 border-2 border-paper-lines/50 shadow-notebook">
                            <h2 className="font-handwriting text-xl text-ink mb-6 flex items-center gap-2">
                                <Heart className="w-5 h-5 text-sticky-pink" />
                                {t.about.credits_title}
                            </h2>
                            <p className="font-handwriting text-base text-pencil leading-relaxed">
                                {t.about.credits_content}
                            </p>
                        </section>
                    </div>

                    {/* Sidebar / Socials - Sticky note style */}
                    <div className="space-y-6">
                        <section className="bg-card rounded-sm p-6 border-2 border-paper-lines/50 shadow-notebook sticky top-24">
                            <h2 className="font-handwriting text-lg text-ink mb-4">{t.about.social_links_title} 🔗</h2>
                            <div className="space-y-3">
                                {socialLinks.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-sm transition-all",
                                            "hover:shadow-notebook-hover active:scale-95",
                                            link.color, "text-ink shadow-tape",
                                            idx % 2 === 0 ? "-rotate-1" : "rotate-1"
                                        )}
                                    >
                                        <div className="p-2 rounded-sm bg-paper shadow-sm">
                                            {link.icon}
                                        </div>
                                        <span className="font-handwriting text-sm">{link.label}</span>
                                    </a>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t-2 border-dashed border-paper-lines text-center">
                                <p className="text-xs font-handwriting text-pencil mb-4">
                                    {t.about.developed_by}
                                </p>
                                <div className="w-16 h-16 rounded-sm mx-auto overflow-hidden border-2 border-ink/20 shadow-notebook rotate-3">
                                    <img src="/PP-Tio.jpg" alt="Developer" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <footer className="mt-12 text-center">
                    <p className="font-handwriting text-sm text-pencil">
                        UrusDiriSendiri - Sebuah Aplikasi Hasil Vibe Coding ✨
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default AboutPage;
