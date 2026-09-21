
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, Users, FileCheck, Clock, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { listLogs, getDailyReportCounts, getAdminDashboardStats } from "@/lib/repositories";
import { AdminLog } from "@/lib/models";
import LoadingSpinner from "@/components/agrisahayak/loading-spinner";


export default function AdminPage() {
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [chartData, setChartData] = useState<{date: string, reports: number}[]>([]);
    const [adminStats, setAdminStats] = useState<{totalReportsToday: number, activeUsers: number, avgConfidence: string, avgResponseTime: string}>({
        totalReportsToday: 0, activeUsers: 0, avgConfidence: '—', avgResponseTime: '—'
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const [fetchedLogs, fetchedChartData, fetchedStats] = await Promise.all([
                listLogs(20),
                getDailyReportCounts(),
                getAdminDashboardStats()
            ]);
            setLogs(fetchedLogs);
            setChartData(fetchedChartData);
            setAdminStats(fetchedStats);
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => fetchData(), 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Listen for reportCreated events to refresh data
    useEffect(() => {
        const handleReportCreated = () => {
            console.log('📊 Admin: reportCreated event received, refreshing...');
            fetchData(true);
        };
        window.addEventListener('reportCreated', handleReportCreated);
        return () => window.removeEventListener('reportCreated', handleReportCreated);
    }, [fetchData]);

    const getStatusVariant = (status: 'success' | 'error' | 'info') => {
        switch(status) {
            case 'success': return 'default';
            case 'error': return 'destructive';
            case 'info': return 'secondary';
            default: return 'outline';
        }
    };

    /** Safely format a timestamp from Firestore Timestamp OR ISO string */
    const formatTimestamp = (ts: any): string => {
        if (!ts) return 'Unknown';
        // Firestore Timestamp object
        if (typeof ts?.toDate === 'function') {
            return ts.toDate().toLocaleString();
        }
        // ISO string
        if (typeof ts === 'string') {
            const parsed = new Date(ts);
            if (!isNaN(parsed.getTime())) {
                return parsed.toLocaleString();
            }
        }
        // Number timestamp
        if (typeof ts === 'number') {
            return new Date(ts).toLocaleString();
        }
        return 'Unknown';
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchData(true)}
                    disabled={refreshing}
                    className="gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Reports Today"
                    value={loading ? '...' : String(adminStats.totalReportsToday)}
                    icon={<FileCheck className="h-5 w-5 text-muted-foreground"/>}
                />
                <MetricCard
                    title="Registered Users"
                    value={loading ? '...' : String(adminStats.activeUsers)}
                    icon={<Users className="h-5 w-5 text-muted-foreground"/>}
                />
                <MetricCard
                    title="Avg. Confidence Score"
                    value={loading ? '...' : adminStats.avgConfidence}
                    icon={<Activity className="h-5 w-5 text-muted-foreground"/>}
                />
                <MetricCard
                    title="Avg. Response Time"
                    value={loading ? '...' : adminStats.avgResponseTime}
                    icon={<Clock className="h-5 w-5 text-muted-foreground"/>}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Reports Per Day</CardTitle>
                    <CardDescription>A chart showing the number of diagnosis reports created over the last week (real-time data).</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                <Line type="monotone" dataKey="reports" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Agent Activity Logs</CardTitle>
                    <CardDescription>Real-time monitoring of AI agent actions from Firestore.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <LoadingSpinner message="Loading logs..." />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex items-center justify-center p-12 text-muted-foreground bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                            <p>No agent activity found.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Agent</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Report ID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Duration (ms)</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">{log.agentName}</TableCell>
                                        <TableCell>{log.action}</TableCell>
                                        <TableCell>{log.reportId || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(log.status)}>{log.status}</Badge>
                                        </TableCell>
                                        <TableCell>{log.duration ?? '-'}</TableCell>
                                        <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function MetricCard({title, value, icon}: {title: string, value: string, icon: React.ReactNode}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}
