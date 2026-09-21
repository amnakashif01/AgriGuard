'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function DemoPage() {
    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 30%, #ffffff 50%, #f0fdfa 70%, #ecfdf5 100%)',
                    backgroundSize: '200% 200%',
                    animation: 'gradient-shift 15s ease infinite'
                }}
            />
            <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl animate-blob pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '2s' }} />
            
            {/* Navbar */}
            <header className="relative z-10 border-b border-gray-200/50 bg-white/70 backdrop-blur-xl">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Button variant="ghost" asChild className="gap-2 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all">
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/60 font-semibold px-3 py-1">
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            AgriGuard Demo
                        </Badge>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative z-10 container mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
                <div className="text-center mb-10 animate-fadeInUp">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                        See <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">AgriGuard</span> in Action
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Watch how our AI-powered assistant helps you diagnose crop diseases and get localized treatment plans in seconds.
                    </p>
                </div>

                <div className="w-full max-w-5xl animate-fadeInUp" style={{ animationDelay: '0.2s', animationFillMode: 'forwards', opacity: 0 }}>
                    <Card className="overflow-hidden border border-gray-200/80 shadow-2xl rounded-3xl bg-white/50 backdrop-blur-sm relative group p-2">
                        {/* Shimmer effect border */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400 opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-3xl -z-10" />
                        
                        <div className="relative rounded-2xl overflow-hidden bg-black shadow-inner aspect-video flex items-center justify-center group/video">
                            <video 
                                className="w-full h-full object-cover"
                                controls
                                autoPlay
                                preload="metadata"
                                poster="/demo-poster.jpg"
                            >
                                <source src="/demo.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                            
                            {/* Decorative overlay when not playing (requires custom video player to fully control, but adding standard HTML5 controls is most robust for now) */}
                        </div>
                    </Card>
                </div>

                {/* Features below video */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl w-full animate-fadeInUp" style={{ animationDelay: '0.4s', animationFillMode: 'forwards', opacity: 0 }}>
                    <div className="flex items-center gap-4 bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                            <Play className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Instant Diagnosis</h3>
                            <p className="text-sm text-gray-500">Under 3 seconds</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-3 bg-teal-100 rounded-xl text-teal-600">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">85%+ Accuracy</h3>
                            <p className="text-sm text-gray-500">Powered by Gemini AI</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Local Treatment</h3>
                            <p className="text-sm text-gray-500">PKR costs & local products</p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-16 text-center animate-fadeInUp" style={{ animationDelay: '0.6s', animationFillMode: 'forwards', opacity: 0 }}>
                    <Button asChild size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-bold px-10 py-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg">
                        <Link href="/login">Try It Yourself Now</Link>
                    </Button>
                </div>
            </main>
        </div>
    );
}
