'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sprout, ArrowLeft, Home, Search, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
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
            <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl animate-blob pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '2s' }} />

            <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-4">
                <div className="text-center animate-fadeInUp">
                    {/* Floating illustration */}
                    <div className="relative w-40 h-40 mx-auto mb-8 animate-float">
                        <div className="absolute inset-0 bg-emerald-100 rounded-full opacity-50 animate-pulse" />
                        <div className="absolute inset-4 bg-emerald-200 rounded-full opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
                            <Sprout className="w-20 h-20" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-gray-100">
                            <AlertCircle className="w-8 h-8 text-amber-500" />
                        </div>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-4 tracking-tighter">
                        404
                    </h1>
                    
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                        Oops! We couldn't find that page
                    </h2>
                    
                    <p className="text-gray-500 max-w-md mx-auto mb-10 text-lg">
                        It looks like the page you are looking for has been moved, deleted, or possibly never existed.
                    </p>

                    <Card className="max-w-md mx-auto p-2 bg-white/70 backdrop-blur-xl border border-gray-100/80 shadow-xl rounded-3xl mb-10">
                        <div className="flex flex-col sm:flex-row gap-3 p-4">
                            <Button asChild className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md rounded-xl font-semibold h-12">
                                <Link href="/">
                                    <Home className="w-4 h-4 mr-2" />
                                    Back to Home
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="flex-1 rounded-xl font-semibold h-12 hover:bg-gray-50">
                                <button onClick={() => window.history.back()}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Go Back
                                </button>
                            </Button>
                        </div>
                    </Card>

                    <div className="flex justify-center gap-6 text-sm font-medium text-gray-500">
                        <Link href="/demo" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                            <Play className="w-4 h-4" /> Watch Demo
                        </Link>
                        <Link href="/login" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                            <Search className="w-4 h-4" /> Start Diagnosis
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Simple Play icon component for the footer links since it wasn't imported at top
function Play(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    )
}
