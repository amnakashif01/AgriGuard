'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, TrendingUp, Shield, Clock, MapPin, Calendar, Activity, AlertTriangle, Leaf, Sprout, BarChart3, ArrowUpRight, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";
import RecentReports from "@/components/agrisahayak/recent-reports";
import WeatherAlertCard from "@/components/agrisahayak/weather-alert-card";
import NotificationsPanel from "@/components/agrisahayak/notifications-panel";
import { useAuth } from "@/firebase";
import { getProfile, listRecentReports, getDashboardStats } from "@/lib/repositories";
import { useEffect, useState, useRef, useCallback } from "react";
import { UserProfile, DiagnosisReport } from "@/lib/models";
import { ScrollAnimation, TouchGesture } from "@/components/ui/interactive";
import { useTranslation } from "react-i18next";
import { usePathname } from 'next/navigation';

/* ΓöÇΓöÇΓöÇ Animated Counter Hook ΓöÇΓöÇΓöÇ */
function useAnimatedCounter(end: number, duration: number = 1200) {
    const [count, setCount] = useState(0);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        if (end === 0) { setCount(0); return; }
        let start = 0;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));
            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            }
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [end, duration]);

    return count;
}

export default function DashboardPage() {
    const { user, isUserLoading } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [recentReports, setRecentReports] = useState<DiagnosisReport[]>([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, highSeverity: 0, thisMonth: 0 });
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const { t } = useTranslation();
    const pathname = usePathname();
    // fetchKey increments every time we want to re-fetch data (on navigation, events, manual refresh)
    const [fetchKey, setFetchKey] = useState(0);

    // Re-fetch when navigating to the dashboard page or when a report is created
    useEffect(() => {
        if (pathname === '/dashboard') {
            setFetchKey(prev => prev + 1);
        }
    }, [pathname]);

    // Listen for reportCreated events (fired by new-report-form after completion)
    useEffect(() => {
        const handleReportCreated = () => {
            console.log('📊 Dashboard: reportCreated event received, refreshing data...');
            setFetchKey(prev => prev + 1);
        };
        window.addEventListener('reportCreated', handleReportCreated);
        return () => window.removeEventListener('reportCreated', handleReportCreated);
    }, []);

    // Manual refresh handler
    const handleRefresh = useCallback(() => {
        setLoading(true);
        setStatsLoading(true);
        setFetchKey(prev => prev + 1);
    }, []);

    // Parallel data fetching with auth guard — re-runs on fetchKey changes
    useEffect(() => {
        if (isUserLoading) return; // Wait for auth to resolve
        if (!user) {
            setLoading(false);
            setStatsLoading(false);
            return;
        }

        // Fetch all data independently for maximum speed and non-blocking UX
        const fetchAll = async () => {
            const cacheKey = `agrisahayak_dashboard_cache_${user.uid}`;
            
            // 1. Try to load from cache immediately to prevent loading spinners
            try {
                const cachedData = sessionStorage.getItem(cacheKey);
                if (cachedData) {
                    const parsed = JSON.parse(cachedData);
                    // Use cache if it's less than 5 minutes old
                    if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
                        if (parsed.profile) setProfile(parsed.profile);
                        if (parsed.reports) setRecentReports(parsed.reports);
                        if (parsed.stats) setStats(parsed.stats);
                        setLoading(false);
                        setStatsLoading(false);
                    }
                }
            } catch (e) {
                console.warn('Dashboard cache read error', e);
            }

            // 2. Fetch fresh data in the background (or foreground if no cache)
            try {
                const [p, r, s] = await Promise.all([
                    getProfile(user.uid),
                    listRecentReports(user.uid, 20),
                    getDashboardStats(user.uid)
                ]);

                if (p) setProfile(p);
                setRecentReports(r);
                setStats(s);
                
                // Save fresh data to cache
                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify({
                        timestamp: Date.now(),
                        profile: p,
                        reports: r,
                        stats: s
                    }));
                } catch (e) {
                    console.warn('Dashboard cache write error', e);
                }
            } catch (e) {
                console.error("Dashboard fetch error:", e);
            } finally {
                setLoading(false);
                setStatsLoading(false);
            }
        };

        fetchAll();
    }, [user, isUserLoading, fetchKey]);

    const totalReports = stats.total;
    const successRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const highSeverityReports = stats.highSeverity;
    const thisMonthReports = stats.thisMonth;

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Morning';
        if (hour < 17) return 'Afternoon';
        return 'Evening';
    };

    return (
        <TouchGesture
            onSwipeLeft={() => console.log('Swipe left')}
            onSwipeRight={() => console.log('Swipe right')}
            className="space-y-8"
        >
            {/* ΓöÇΓöÇ HERO WELCOME BANNER ΓöÇΓöÇ */}
            <ScrollAnimation animation="fadeIn" delay={0}>
                <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-white shadow-2xl animate-fadeInUp"
                     style={{
                         background: 'linear-gradient(135deg, #059669 0%, #10b981 25%, #0d9488 50%, #0891b2 75%, #059669 100%)',
                         backgroundSize: '200% 200%',
                         animation: 'gradient-shift 8s ease infinite, fadeInUp 0.6s ease-out',
                     }}
                >
                    {/* Animated decorative blobs */}
                    <div className="absolute -top-10 -end-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none animate-blob" />
                    <div className="absolute -bottom-16 -start-10 w-80 h-80 bg-emerald-300/15 rounded-full blur-3xl pointer-events-none animate-blob" style={{ animationDelay: '2s' }} />
                    <div className="absolute top-1/2 end-1/4 w-40 h-40 bg-teal-200/15 rounded-full blur-2xl pointer-events-none animate-blob" style={{ animationDelay: '4s' }} />
                    <div className="absolute bottom-0 end-0 w-64 h-64 bg-cyan-300/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />

                    {/* Mesh gradient overlay */}
                    <div className="absolute inset-0 opacity-30 pointer-events-none"
                         style={{
                             backgroundImage: 'radial-gradient(at 20% 30%, rgba(255,255,255,0.15) 0, transparent 50%), radial-gradient(at 80% 70%, rgba(255,255,255,0.1) 0, transparent 50%), radial-gradient(at 50% 50%, rgba(6,182,212,0.1) 0, transparent 50%)'
                         }}
                    />

                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-2xl shadow-inner border border-white/20">
                                    <Leaf className="h-5 w-5 text-white drop-shadow-sm" />
                                </div>
                                <Badge className="bg-white/15 text-white border-white/25 backdrop-blur-md hover:bg-white/25 py-1.5 px-4 rounded-full shadow-sm">
                                    <Sparkles className="h-3.5 w-3.5 me-1.5 animate-pulse" />
                                    {t('dashboard.active_dashboard')}
                                </Badge>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 drop-shadow-lg tracking-tight leading-tight">
                                Good {greeting()},{' '}
                                <span className="relative">
                                    {profile?.name || 'Farmer'}
                                    <span className="absolute -bottom-1 left-0 right-0 h-1 bg-white/30 rounded-full" />
                                </span>
                                !
                            </h1>
                            <p className="text-green-50/90 text-lg md:text-xl max-w-xl font-medium leading-relaxed">
                                {t('dashboard.subtitle')}
                            </p>
                            {profile?.location && (
                                <div className="flex items-center gap-2 mt-5 text-green-50 text-sm font-medium bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm border border-white/15 shadow-inner">
                                    <MapPin className="h-4 w-4" />
                                    <span>{profile.location}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                            <Button
                                asChild
                                size="lg"
                                className="bg-white text-emerald-700 hover:bg-green-50 font-bold text-lg px-8 py-7 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-white/50 animate-pulse-glow"
                            >
                                <Link href="/report/new">
                                    <PlusCircle className="me-2 h-6 w-6" />
                                    {t('dashboard.new_diagnosis')}
                                </Link>
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={handleRefresh}
                                className="bg-white/15 text-white border-white/30 hover:bg-white/25 font-bold px-6 py-7 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm"
                            >
                                <RefreshCw className={`me-2 h-5 w-5 ${loading || statsLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </ScrollAnimation>

            {/* ΓöÇΓöÇ STAT CARDS ΓöÇΓöÇ */}
            <ScrollAnimation animation="fadeIn" delay={100}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <GradientStatCard
                        title={t('dashboard.total_reports')}
                        value={statsLoading ? -1 : totalReports}
                        icon={<BarChart3 className="h-6 w-6" />}
                        gradient="from-blue-500 via-indigo-500 to-violet-600"
                        bg="from-blue-50/90 via-indigo-50/50 to-violet-50/90"
                        border="border-blue-200/60"
                        trend={totalReports === 0 ? "No reports yet" : "+12% this month"}
                        trendPositive={true}
                        index={0}
                    />
                    <GradientStatCard
                        title={t('dashboard.success_rate')}
                        value={statsLoading ? -1 : successRate}
                        suffix="%"
                        icon={<Shield className="h-6 w-6" />}
                        gradient="from-emerald-500 via-green-500 to-teal-600"
                        bg="from-emerald-50/90 via-green-50/50 to-teal-50/90"
                        border="border-emerald-200/60"
                        trend={successRate > 80 ? "Excellent" : "Improving..."}
                        trendPositive={successRate > 80}
                        index={1}
                    />
                    <GradientStatCard
                        title={t('dashboard.high_priority')}
                        value={statsLoading ? -1 : highSeverityReports}
                        icon={<AlertTriangle className="h-6 w-6" />}
                        gradient="from-orange-500 via-amber-500 to-red-500"
                        bg="from-orange-50/90 via-amber-50/50 to-red-50/90"
                        border="border-orange-200/60"
                        trend={highSeverityReports > 0 ? "Needs attention!" : "All clear"}
                        trendPositive={highSeverityReports === 0}
                        index={2}
                    />
                    <GradientStatCard
                        title={t('dashboard.this_month')}
                        value={statsLoading ? -1 : thisMonthReports}
                        icon={<Calendar className="h-6 w-6" />}
                        gradient="from-purple-500 via-fuchsia-500 to-pink-600"
                        bg="from-purple-50/90 via-fuchsia-50/50 to-pink-50/90"
                        border="border-purple-200/60"
                        trend={thisMonthReports === 0 ? "No activity this month" : "+8% vs last month"}
                        trendPositive={true}
                        index={3}
                    />
                </div>
            </ScrollAnimation>

            {/* ΓöÇΓöÇ MAIN CONTENT ΓöÇΓöÇ */}
            <ScrollAnimation animation="fadeIn" delay={200}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Weather + Notifications */}
                    <div className="lg:col-span-2 space-y-8">
                        <WeatherAlertCard />
                        <NotificationsPanel />
                    </div>

                    {/* Right: Quick Actions */}
                    <div className="lg:col-span-1">
                        <Card className="border border-gray-100/80 shadow-xl bg-white/90 backdrop-blur-xl overflow-hidden h-full rounded-3xl relative">
                            {/* Subtle gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-transparent to-emerald-50/20 pointer-events-none" />
                            <CardHeader className="pb-6 bg-gradient-to-r from-gray-50/80 to-emerald-50/40 border-b border-gray-100/80 relative">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2.5 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-2xl shadow-lg">
                                        <Clock className="h-5 w-5 text-white" />
                                    </div>
                                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{t('dashboard.quick_actions')}</CardTitle>
                                </div>
                                <CardDescription className="text-sm font-medium text-gray-500">Common tasks at a glance</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3.5 pt-6 p-6 relative">
                                <QuickActionButton
                                    href="/report/new"
                                    icon={<PlusCircle className="h-5 w-5" />}
                                    label={t('dashboard.new_report_action')}
                                    gradient="from-emerald-500 via-green-500 to-teal-600"
                                    hoverGradient="hover:from-emerald-500 hover:via-green-500 hover:to-teal-600"
                                    solid
                                    index={0}
                                />
                                <QuickActionButton
                                    href="/marketplace"
                                    icon={<MapPin className="h-5 w-5" />}
                                    label={t('dashboard.nearby_suppliers')}
                                    gradient="from-blue-500 via-cyan-500 to-sky-600"
                                    hoverGradient="hover:from-blue-500 hover:via-cyan-500 hover:to-sky-600"
                                    index={1}
                                />
                                <QuickActionButton
                                    href="/profile"
                                    icon={<Sprout className="h-5 w-5" />}
                                    label={t('dashboard.update_profile')}
                                    gradient="from-purple-500 via-violet-500 to-indigo-600"
                                    hoverGradient="hover:from-purple-500 hover:via-violet-500 hover:to-indigo-600"
                                    index={2}
                                />
                                <QuickActionButton
                                    href="/admin"
                                    icon={<Activity className="h-5 w-5" />}
                                    label={t('dashboard.view_admin')}
                                    gradient="from-orange-500 via-amber-500 to-yellow-600"
                                    hoverGradient="hover:from-orange-500 hover:via-amber-500 hover:to-yellow-600"
                                    index={3}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </ScrollAnimation>

            {/* ΓöÇΓöÇ RECENT REPORTS ΓöÇΓöÇ */}
            <ScrollAnimation animation="fadeIn" delay={300}>
                <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-gray-100/80 shadow-xl p-8 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-50/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="flex items-center justify-between mb-8 relative">
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent tracking-tight">{t('dashboard.recent_reports')}</h2>
                            <p className="text-gray-500 text-base mt-1 font-medium">{t('dashboard.recent_reports_desc')}</p>
                        </div>
                        <Button asChild variant="outline" size="sm" className="gap-2 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 hover:border-green-300 transition-all duration-300 shadow-sm font-semibold">
                            <Link href="/report/new">
                                <PlusCircle className="h-4 w-4" />
                                {t('dashboard.new_diagnosis')}
                            </Link>
                        </Button>
                    </div>
                    <RecentReports reports={recentReports} setReports={setRecentReports} loading={loading} />
                </div>
            </ScrollAnimation>
        </TouchGesture>
    );
}

/* ΓöÇΓöÇΓöÇ Skeleton Loading Pulse ΓöÇΓöÇΓöÇ */
function StatSkeleton() {
    return (
        <div className="animate-pulse space-y-3">
            <div className="h-3 bg-gray-200/60 rounded-full w-20" />
            <div className="h-8 bg-gray-200/60 rounded-lg w-16" />
            <div className="h-3 bg-gray-200/60 rounded-full w-24" />
        </div>
    );
}

/* ΓöÇΓöÇΓöÇ Gradient Stat Card ΓöÇΓöÇΓöÇ */
function GradientStatCard({
    title, value, suffix = '', icon, gradient, bg, border, trend, trendPositive, index = 0
}: {
    title: string; value: number; suffix?: string; icon: React.ReactNode;
    gradient: string; bg: string; border: string;
    trend: string; trendPositive: boolean; index?: number;
}) {
    const animatedValue = useAnimatedCounter(value >= 0 ? value : 0, 1400);
    const isLoading = value < 0;

    return (
        <div
            className={`group relative overflow-hidden rounded-3xl border ${border} bg-gradient-to-br ${bg} p-6 shadow-md hover:shadow-2xl hover:scale-[1.03] transition-all duration-500 cursor-default backdrop-blur-md opacity-0 animate-fadeInUp`}
            style={{ animationDelay: `${index * 100 + 200}ms`, animationFillMode: 'forwards' }}
        >
            {/* Animated glow blob */}
            <div className={`absolute -top-8 -end-8 w-36 h-36 rounded-full bg-gradient-to-br ${gradient} opacity-[0.08] group-hover:opacity-[0.18] blur-2xl transition-all duration-500 group-hover:scale-125`} />

            {/* Shimmer overlay on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

            <div className="relative">
                <div className="flex items-center justify-between mb-5">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl group-hover:rotate-3 transition-all duration-500`}>
                        {icon}
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-1 translate-x-1 group-hover:translate-y-0 group-hover:translate-x-0" />
                </div>

                <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">{title}</p>
                {isLoading ? (
                    <StatSkeleton />
                ) : (
                    <>
                        <p className="text-4xl font-black text-gray-900 tracking-tight tabular-nums">
                            {animatedValue}{suffix}
                        </p>
                        <p className={`text-sm mt-3 font-semibold flex items-center gap-1.5 ${trendPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                            <span className={`inline-block w-2 h-2 rounded-full ${trendPositive ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                            {trend}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

/* ΓöÇΓöÇΓöÇ Quick Action Button ΓöÇΓöÇΓöÇ */
function QuickActionButton({
    href, icon, label, gradient, hoverGradient, solid = false, index = 0
}: {
    href: string; icon: React.ReactNode; label: string; gradient: string; hoverGradient?: string; solid?: boolean; index?: number;
}) {
    return (
        <Link
            href={href}
            className={`group flex items-center gap-4 w-full p-4 rounded-2xl border transition-all duration-400 hover:shadow-lg hover:-translate-y-0.5 opacity-0 animate-fadeInUp ${
                solid
                    ? `bg-gradient-to-r ${gradient} text-white border-transparent hover:opacity-95 shadow-lg hover:shadow-xl`
                    : `bg-white/80 border-gray-100/80 hover:border-transparent hover:bg-gradient-to-r ${hoverGradient || ''} hover:text-white text-gray-700 shadow-sm hover:shadow-lg`
            }`}
            style={{ animationDelay: `${index * 80 + 400}ms`, animationFillMode: 'forwards' }}
        >
            <div className={`flex-shrink-0 p-2.5 rounded-xl transition-all duration-300 ${
                solid
                    ? 'bg-white/20 shadow-inner backdrop-blur-sm'
                    : `bg-gradient-to-br ${gradient} text-white shadow-md group-hover:bg-white/20 group-hover:shadow-inner group-hover:text-white`
            }`}>
                {icon}
            </div>
            <span className="min-w-0 flex-1 overflow-visible break-words text-base font-bold leading-tight tracking-tight whitespace-normal">{label}</span>
            <ArrowUpRight className="h-5 w-5 flex-shrink-0 opacity-40 group-hover:opacity-100 -translate-y-1 translate-x-1 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
        </Link>
    );
}
