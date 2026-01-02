import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Github, Linkedin, Heart, Sparkles, Rocket, Coffee, ShieldCheck, Monitor, Atom, FileCode2, Palette, Layers, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

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
        // {
        //     icon: <Globe className="w-5 h-5" />,
        //     label: t.about.portfolio_label,
        //     href: "https://your-portfolio.com", // User can change this
        //     color: "bg-blue-500/10 text-blue-600",
        // },
        {
            icon: <Github className="w-5 h-5" />,
            label: t.about.github_label,
            href: "https://github.com/atiohaidar/urus-diri-sendiri",
            color: "bg-slate-800/10 text-slate-800 dark:text-slate-200",
        },
        {
            icon: <Linkedin className="w-5 h-5" />,
            label: t.about.linkedin_label,
            href: "https://linkedin.com/in/atiohaidar",
            color: "bg-blue-600/10 text-blue-700",
        },
    ];

    return (
        <div className="min-h-screen bg-background pb-12 animate-in fade-in duration-500">
            {/* Hero Header */}
            <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary/20 via-background to-background border-b border-border/50">
                <div className="container max-w-4xl mx-auto px-4 py-6 relative h-full flex flex-col justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-full bg-background/50 backdrop-blur-md shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>

                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 animate-bounce">
                            <Sparkles className="w-3 h-3" />
                            <span>v1.0.0</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                            UrusDiri<span className="text-primary">Sendiri</span>
                        </h1>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-10 right-10 opacity-10 blur-2xl">
                    <div className="w-32 h-32 bg-primary rounded-full" />
                </div>
            </div>

            <main className="container max-w-4xl mx-auto px-4 -mt-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        <section className="bg-card rounded-3xl p-8 border border-border/50 shadow-xl card-elevated">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Rocket className="w-6 h-6 text-primary" />
                                {t.about.title}
                            </h2>
                            <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                                {t.about.description}
                            </p>

                            <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50">
                                <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    {t.about.mission_title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {t.about.mission_content}
                                </p>
                            </div>
                        </section>

                        <section className="bg-card rounded-3xl p-8 border border-border/50 shadow-xl overflow-hidden relative">
                            {/* Background Pattern */}
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Rocket className="w-24 h-24 rotate-45" />
                            </div>

                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 relative z-10">
                                <Sparkles className="w-6 h-6 text-primary" />
                                {t.about.workflow_title}
                            </h2>

                            <div className="space-y-6 relative z-10">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 border border-primary/20">1</div>
                                        <div className="w-0.5 flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-2"></div>
                                    </div>
                                    <div className="pb-4">
                                        <a href="https://stitch.withgoogle.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2">
                                            Stitch <Globe className="w-3 h-3" />
                                        </a>
                                        <p className="text-sm text-muted-foreground mt-1 underline decoration-primary/30 underline-offset-4">
                                            {t.about.workflow_design}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 border border-primary/20">2</div>
                                        <div className="w-0.5 flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-2"></div>
                                    </div>
                                    <div className="pb-4">
                                        <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2">
                                            AI Studio <Sparkles className="w-3 h-3" />
                                        </a>
                                        <p className="text-sm text-muted-foreground mt-1 underline decoration-primary/30 underline-offset-4">
                                            {t.about.workflow_prompts}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 border border-primary/20">3</div>
                                        <div className="w-0.5 flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-2"></div>
                                    </div>
                                    <div className="pb-4">
                                        <a href="https://lovable.dev/" target="_blank" rel="noopener noreferrer" className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2">
                                            Lovable <Monitor className="w-3 h-3" />
                                        </a>
                                        <p className="text-sm text-muted-foreground mt-1 underline decoration-primary/30 underline-offset-4">
                                            {t.about.workflow_frontend}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-primary/20">4</div>
                                    <div>
                                        <a href="https://antigravity.google/" target="_blank" rel="noopener noreferrer" className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2">
                                            Antigravity <Rocket className="w-3 h-3" />
                                        </a>
                                        <p className="text-sm text-muted-foreground mt-1 underline decoration-primary/30 underline-offset-4">
                                            {t.about.workflow_refinement}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-card rounded-3xl p-8 border border-border/50 shadow-lg">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Heart className="w-5 h-5 text-pink-500" />
                                {t.about.credits_title}
                            </h2>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                                {t.about.credits_content}
                            </p>
                            {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 shadow-inner">
                                {techStack.map((tech, i) => (
                                    <div key={i} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-background border border-border/50 shadow-sm hover:scale-105 transition-transform cursor-default text-center">
                                        <div className="p-2 rounded-lg bg-muted/50">
                                            {tech.icon}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-tight text-foreground/80">{tech.label}</span>
                                    </div>
                                ))}
                            </div> */}
                        </section>
                    </div>

                    {/* Sidebar / Socials */}
                    <div className="space-y-6">
                        <section className="bg-card rounded-3xl p-6 border border-border/50 shadow-lg sticky top-24">
                            <h2 className="text-lg font-bold mb-4">{t.about.social_links_title}</h2>
                            <div className="space-y-3">
                                {socialLinks.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-3 p-3 rounded-2xl border border-transparent transition-all hover:scale-105 active:scale-95 group ${link.color}`}
                                    >
                                        <div className="p-2 rounded-xl bg-background shadow-sm group-hover:shadow-md transition-shadow">
                                            {link.icon}
                                        </div>
                                        <span className="font-semibold text-sm">{link.label}</span>
                                    </a>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-border/50 text-center">
                                <p className="text-xs text-muted-foreground mb-4">
                                    {t.about.developed_by}
                                </p>
                                <div className="w-16 h-16 rounded-full mx-auto overflow-hidden border-4 border-primary/20 shadow-lg">
                                    <img src="/PP-Tio.jpg" alt="Developer" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <footer className="mt-12 text-center text-xs text-muted-foreground">
                    <p>UrusDiriSendiri - Sebuah Aplikasi Hasil Vibe Coding</p>
                </footer>
            </main>
        </div>
    );
};

export default AboutPage;
