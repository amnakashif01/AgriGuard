
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from 'next/image';
import { Upload, X, MapPin, Sparkles, Shield, Leaf, AlertTriangle } from 'lucide-react';
import { instantDiagnosisFromImageAndSymptoms } from '@/ai/flows/instant-diagnosis-from-image-and-symptoms';

import LoadingSpinner from './loading-spinner';
import DiagnosisCard from './diagnosis-card';
import { ProgressSteps } from "@/components/ui/progress-enhanced";
import { SkeletonForm } from "@/components/ui/skeleton-enhanced";
import { InteractiveButton, ScrollAnimation, TouchGesture } from "@/components/ui/interactive";
import { AccessibleFormField, AccessibleButton, LiveRegion } from "@/components/ui/accessibility";
import { useToast } from "@/hooks/use-toast";
import { sendDiseaseWarning, sendTreatmentReminder } from "@/lib/notifications";
import TreatmentPlanCard from './treatment-plan-card';
import SuppliersCard from './suppliers-card';
import { useAuth } from '@/firebase';
import { useTranslation } from "react-i18next";
import { createReport, createLog, updateReport, getProfile } from '@/lib/repositories';
import { DiagnosisReport, UserProfile } from '@/lib/models';

type LoadingState = 'idle' | 'starting' | 'diagnosing' | 'planning' | 'done' | 'error';
type LoadingMessages = { [key in LoadingState]?: string };

const loadingMessages: LoadingMessages = {
    starting: "Creating report and uploading image...",
    diagnosing: 'Analyzing your crop with AI...',
    planning: 'Creating personalized treatment plan...',
};

function fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function blobToDataUri(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Compress an image File using an offscreen canvas and return a Blob
async function compressImage(file: File, maxWidth = 1024, quality = 0.8): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
        try {
            const img = document.createElement('img') as HTMLImageElement;
            img.onload = () => {
                try {
                    const ratio = Math.min(1, maxWidth / img.width);
                    const width = Math.round(img.width * ratio);
                    const height = Math.round(img.height * ratio);
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) throw new Error('Canvas context not available');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(
                        blob => {
                            if (!blob) return reject(new Error('Compression toBlob returned null'));
                            resolve(blob);
                        },
                        'image/jpeg',
                        quality
                    );
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = () => reject(new Error('Failed to load image for compression'));
            // Use object URL to avoid base64 memory usage
            const url = URL.createObjectURL(file);
            img.src = url;
            // revoke later
            img.addEventListener('load', () => URL.revokeObjectURL(url));
        } catch (err) {
            reject(err);
        }
    });
}

// Create a small thumbnail data URI (safe for Firestore) -- keep under ~200KB
async function createThumbnailDataUri(file: File, maxWidth = 480, quality = 0.65): Promise<string> {
    const blob = await compressImage(file, maxWidth, quality);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export default function NewReportForm() {
    const { user, isUserLoading } = useAuth();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [symptoms, setSymptoms] = useState('');
    const [selectedCrop, setSelectedCrop] = useState<string>('');
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    const [report, setReport] = useState<DiagnosisReport | null>(null);
    const { toast } = useToast();
    const { t } = useTranslation();

    // Added state for simulated progress
    const [simulatedProgress, setSimulatedProgress] = useState(0);

    // Simulate progress while starting
    useEffect(() => {
        if (loadingState === 'starting') {
            setSimulatedProgress(0);
            const interval = setInterval(() => {
                setSimulatedProgress(prev => {
                    // Slowly approach 33% but don't quite reach it until done
                    const increment = (33 - prev) * 0.1;
                    return Math.min(33, prev + Math.max(0.5, increment));
                });
            }, 500);
            return () => clearInterval(interval);
        } else if (loadingState === 'diagnosing') {
            setSimulatedProgress(66);
        } else if (loadingState === 'planning') {
            setSimulatedProgress(95);
        }
    }, [loadingState]);
    
    // Track which report ID has had diagnosis/planning initiated to prevent duplicate generation
    const diagnosisInitiatedForReportIdRef = useRef<string | null>(null);
    const planningInitiatedForReportIdRef = useRef<string | null>(null);
    
    // Track if async operations are in progress
    const diagnosisInProgressRef = useRef(false);
    const planningInProgressRef = useRef(false);

    // Fetch user profile when user changes
    useEffect(() => {
        if (user) {
            getProfile(user.uid).then(setProfile);
        } else {
            setProfile(null);
        }
    }, [user]);

    // Effect to run the diagnostic agent
    useEffect(() => {
        const shouldRunDiagnosis = 
            loadingState === 'diagnosing' && 
            user && 
            report && 
            report.id &&
            report.imageUrl && 
            !report.disease && // Don't re-run if diagnosis already exists
            diagnosisInitiatedForReportIdRef.current !== report.id &&
            !diagnosisInProgressRef.current; // Don't start if already in progress
            
        if (shouldRunDiagnosis) {
            diagnosisInitiatedForReportIdRef.current = report.id; // Mark this report ID as initiated
            diagnosisInProgressRef.current = true; // Mark as in progress
            
            console.log(`🔵 Starting diagnosis for report ${report.id}`);
            
            (async () => {
                const startTime = Date.now();
                await createLog({ agentName: 'diagnosticAgent', action: 'diagnosis_started', reportId: report.id, status: 'info' });
                try {
                    // Keep the server-action payload small enough for Vercel and speed up Gemini analysis.
                    const analysisBlob = await compressImage(imageFile!, 512, 0.6);
                    const photoDataUri = await blobToDataUri(analysisBlob);
                    
                    // Auto-detect crop or use selected
                    const cropToAnalyze = selectedCrop && selectedCrop !== 'Auto' ? selectedCrop : (profile?.crops?.[0] || 'Unknown Crop');
                    
                    const diagnosis = await instantDiagnosisFromImageAndSymptoms({
                        photoDataUri,
                        symptoms,
                        crop: cropToAnalyze,
                        language: profile?.language || 'english'
                    });
                    
                    console.log(`✅ Diagnosis completed for report ${report.id}: ${diagnosis.disease}, confidence: ${diagnosis.confidence}%`);
                    
                    await updateReport(user.uid, report.id, {
                        crop: diagnosis.crop !== 'Unknown Crop' ? diagnosis.crop : cropToAnalyze, // Use AI refined crop or fallback to user selection
                        disease: diagnosis.disease,
                        confidence: diagnosis.confidence,
                        affectedParts: diagnosis.affectedParts,
                        severity: diagnosis.severity,
                        description: diagnosis.description,
                        ...(diagnosis.plan ? { plan: diagnosis.plan } : { plan: null }),
                    });

                    if (profile?.notificationPreferences?.weatherAlerts !== false && diagnosis.severity === 'High') {
                        await sendDiseaseWarning(user.uid, cropToAnalyze, diagnosis.disease, profile?.location || 'your area');
                    }
                    
                    await createLog({ agentName: 'diagnosticAgent', action: 'diagnosis_completed', reportId: report.id, status: 'success', duration: Date.now() - startTime, payload: diagnosis });
                    
                    diagnosisInProgressRef.current = false; // Mark as complete
                    
                    const isNotCrop = diagnosis.disease?.toLowerCase().includes('not a crop');
                    
                    if (isNotCrop) {
                        toast({ title: "Analysis Complete", description: "The image does not appear to be a plant. No treatment plan generated.", className: "bg-blue-100 text-blue-800" });
                        await updateReport(user.uid, report.id, { status: 'Complete' } as any);
                        setReport(prev => prev ? { ...prev, ...diagnosis, status: 'Complete' } : null);
                        setLoadingState('done');
                        window.dispatchEvent(new Event('reportCreated'));
                    } else {
                        // Plan was successfully evaluated (either generated, or skipped because plant is healthy)
                        if (diagnosis.plan && profile?.notificationPreferences?.treatmentReminders !== false && diagnosis.plan.steps?.[0]?.title) {
                            await sendTreatmentReminder(user.uid, diagnosis.plan.steps[0].title, new Date());
                        }
                        await updateReport(user.uid, report.id, { status: 'Complete' } as any);
                        setReport(prev => prev ? { ...prev, ...diagnosis, status: 'Complete' } : null);
                        toast({ title: "Analysis Complete!", description: "Your complete report is now available.", className: "bg-green-100 text-green-800" });
                        setLoadingState('done');
                        window.dispatchEvent(new Event('reportCreated'));
                    }
                } catch (e: any) {
                    console.error("Diagnostic agent error:", e);
                        // Mark the report as pending for background retry and create an error log
                        try {
                            await updateReport(user.uid, report.id, { status: 'Pending' } as any);
                        } catch (updateErr) {
                            console.warn('Failed to mark report Pending:', updateErr);
                        }
                        await createLog({ agentName: 'diagnosticAgent', action: 'diagnosis_failed', reportId: report.id, status: 'error', duration: Date.now() - startTime, payload: { error: e?.message || String(e) } });
                        const actualError = e?.message ? ` (${e.message})` : '';
                        setError(`AI service is temporarily unavailable${actualError}. We've saved your report and will retry diagnosis. Please check back in a few minutes or try again.`);
                        diagnosisInProgressRef.current = false; // Mark as complete (failed)
                        diagnosisInitiatedForReportIdRef.current = null; // Reset on error
                        setLoadingState('idle');
                }
            })();
        } else if (report?.disease && loadingState === 'diagnosing') {
            // Diagnosis already exists, skip to planning
            console.log(`⏭️ Skipping diagnosis for report ${report.id} - diagnosis already exists: ${report.disease}`);
            setLoadingState('planning');
        } else if (diagnosisInProgressRef.current && loadingState === 'diagnosing') {
            console.log(`⏸️ Diagnosis already in progress for report ${report?.id}, blocking duplicate call`);
        }
    }, [loadingState, user, report?.id, report?.imageUrl, report?.disease, imageFile, symptoms, toast, selectedCrop, profile]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                toast({ title: "Image too large", description: "Please upload an image under 10MB.", variant: "destructive" });
                return;
            }
            if (!['image/png', 'image/jpeg'].includes(file.type)) {
                toast({ title: "Invalid file type", description: "Please upload a PNG or JPG image.", variant: "destructive" });
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loadingState !== 'idle') return;
        if (!imageFile || !user) {
            toast({ title: "Missing prerequisites", description: "Please upload an image and ensure you are logged in.", variant: "destructive" });
            return;
        }

        setLoadingState('starting');
        setError(null);
        // Reset all refs for new diagnosis (new report will get new ID)
        diagnosisInitiatedForReportIdRef.current = null;
        planningInitiatedForReportIdRef.current = null;
        diagnosisInProgressRef.current = false;
        planningInProgressRef.current = false;
        const startTime = Date.now();
        let reportId = '';

        try {
            console.log("Starting report creation process...");
            
            // 1. Create initial report document
            console.log("Creating report document...");
            reportId = await createReport(user.uid, {
                crop: profile?.crops?.[0] || 'Crop to be identified', // Use first crop from profile or placeholder
                symptoms,
                status: 'Processing',
            } as any);
            console.log("Report created with ID:", reportId);

            await createLog({ agentName: 'ingestAgent', action: 'report_created', reportId, status: 'success' });
            
            // 2. Store a small thumbnail in Firestore; Firebase Storage is optional
            console.log("Creating report thumbnail...");
            try {
                const imageThumb = await createThumbnailDataUri(imageFile, 480, 0.65);
                console.log("Generated thumbnail data URI (length):", imageThumb.length);
                await updateReport(user.uid, reportId, { imageThumb } as any);
                setReport({ id: reportId, imageUrl: imageThumb, imageThumb, symptoms } as any);
                await createLog({ agentName: 'ingestAgent', action: 'thumbnail_stored', reportId, status: 'info', payload: { length: imageThumb.length } });
            } catch (thumbErr: any) {
                console.error("Thumbnail creation failed:", thumbErr);
                setError('Image processing failed. Please try a smaller JPG or PNG image.');
                setLoadingState('error');
                await createLog({ agentName: 'ingestAgent', action: 'ingestion_failed', reportId, status: 'error', payload: { error: String(thumbErr) } });
                return;
            }

            // The original imageFile remains available locally for Gemini analysis.
            await createLog({
                agentName: 'ingestAgent',
                action: 'image_uploaded',
                reportId: reportId,
                status: 'success',
                duration: Date.now() - startTime,
                payload: { symptoms }
            });

            console.log("Hagnosis state...");
            // 4. Trigger the first agent
            setLoadingState('diagnosing');

        } catch (error: any) {
            console.error("Submission error:", error);
            console.error("Error details:", {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            setError(`Failed to start the diagnosis process: ${error.message}. Check your connection and try again.`);
            setLoadingState('error');
            if (reportId) {
                await createLog({ agentName: 'ingestAgent', action: 'ingestion_failed', reportId, status: 'error', payload: { error: error.message } });
            }
        }
    };
    
    const resetForm = () => {
        removeImage();
        setSymptoms('');
        setSelectedCrop('');
        setReport(null);
        setError(null);
        setLoadingState('idle');
        setSimulatedProgress(0);
        // Reset all tracking refs to allow fresh report creation
        diagnosisInitiatedForReportIdRef.current = null;
        planningInitiatedForReportIdRef.current = null;
        diagnosisInProgressRef.current = false;
        planningInProgressRef.current = false;
    }

    if (loadingState === 'done' && report && imagePreview) {
        const isNotCrop = report.disease?.toLowerCase().includes('not a crop');
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold font-headline">Diagnosis Report</h1>
                    <Button onClick={resetForm}>Create New Report</Button>
                </div>
                {isNotCrop ? (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                        <div className="p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-6 bg-gradient-to-br from-amber-50 to-orange-50/30">
                            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
                                <AlertTriangle className="h-10 w-10 text-amber-500" />
                            </div>
                            <div className="space-y-2 max-w-md">
                                <h2 className="text-2xl font-bold text-gray-900">Not a Plant</h2>
                                <p className="text-gray-600 text-lg">
                                    The image you uploaded doesn't appear to be a crop or plant. 
                                </p>
                                <p className="text-gray-500">
                                    Our AI can only diagnose diseases and provide treatment plans for agricultural crops. Please upload a clear photo of the affected plant.
                                </p>
                            </div>
                            <div className="mt-8 relative rounded-2xl overflow-hidden shadow-md border-4 border-white inline-block">
                                <Image 
                                    src={imagePreview} 
                                    alt="Uploaded image" 
                                    width={250} 
                                    height={200} 
                                    className="object-cover h-48 w-auto max-w-[250px]" 
                                />
                            </div>
                        </div>
                    </Card>
                ) : (
                    <>
                        <DiagnosisCard diagnosis={report as any} imageUrl={imagePreview} />
                        {report.plan && <TreatmentPlanCard plan={report.plan as any} />}
                        <SuppliersCard />
                    </>
                )}
            </div>
        );
    }

    if (['starting', 'diagnosing', 'planning'].includes(loadingState)) {
        const steps = ['Upload Image', 'AI Analysis', 'Treatment Plan'];
        const descriptions = ['Image secured', 'Identifying issues', 'Generating plan'];
        const currentStepIndex = loadingState === 'starting' ? 0 : loadingState === 'diagnosing' ? 1 : 2;
        const progress = Math.round(loadingState === 'starting' ? simulatedProgress : loadingState === 'diagnosing' ? 66 : 95);

        return (
            <div className="w-full max-w-6xl mx-auto">
                <div className="mb-8 md:mb-12 text-center md:text-left flex flex-col items-center md:items-start">
                    <Badge variant="outline" className="mb-4 bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 text-sm font-medium">
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Crop Diagnosis
                    </Badge>
                    <h1 className="text-3xl md:text-5xl font-extrabold font-headline text-gray-900 tracking-tight mb-3">
                        Processing Your Diagnosis
                    </h1>
                    <p className="text-base md:text-lg text-gray-600 max-w-2xl leading-relaxed">
                        Our advanced AI is analyzing your crop image and symptoms to prepare a personalized, actionable treatment plan.
                    </p>
                </div>

                <Card className="shadow-2xl border-0 overflow-hidden bg-white rounded-[24px]">
                    <div className="flex flex-col lg:flex-row">
                        {/* Left Side: Processing State & Animation */}
                        <div className="lg:w-3/5 p-8 md:p-12 bg-gradient-to-br from-emerald-50/50 via-white to-green-50/30 relative flex flex-col justify-center">
                            {/* Decorative background blob */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full blur-[80px] opacity-40 pointer-events-none -translate-y-1/2 translate-x-1/3" />
                            
                            <div className="w-full max-w-md mx-auto mb-12 relative z-10">
                                <ProgressSteps 
                                    steps={steps} 
                                    descriptions={descriptions}
                                    currentStep={currentStepIndex + 1}
                                />
                            </div>

                            <div className="relative z-10 flex flex-col items-center">
                                <LoadingSpinner 
                                    message={loadingMessages[loadingState as LoadingState]}
                                    className="mb-6"
                                    size="lg"
                                    variant="agricultural"
                                    showProgress={true}
                                    progress={progress}
                                />
                                
                                <div className="mt-8 flex items-center justify-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-sm w-full max-w-md mx-auto">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 rounded-full animate-pulse">
                                            <Shield className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div className="text-sm">
                                            <p className="text-emerald-900 font-semibold">Secure AI Processing</p>
                                            <p className="text-emerald-700/80">Please do not close this window. Takes ~30-60s.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Upload Summary */}
                        <div className="lg:w-2/5 p-8 md:p-12 bg-gray-50/80 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                                <Leaf className="w-5 h-5 mr-2 text-primary" />
                                Analysis Details
                            </h3>
                            
                            {imagePreview && (
                                <div className="mb-8">
                                    <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Crop Image</p>
                                    <div className="relative group rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-white">
                                        <div className="aspect-[4/3] w-full relative">
                                            <Image 
                                                src={imagePreview} 
                                                alt="Crop to be diagnosed" 
                                                fill
                                                style={{ objectFit: 'cover' }}
                                                className="transition-transform duration-700 group-hover:scale-105" 
                                            />
                                            {/* Scanning line overlay */}
                                            <div className="absolute inset-0 z-10 overflow-hidden opacity-50 mix-blend-overlay">
                                                <div className="h-1 bg-emerald-400 w-full absolute shadow-[0_0_8px_2px_rgba(52,211,153,0.5)] animate-[scan_2.5s_ease-in-out_infinite]" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                            <div className="flex items-center text-white/90 text-sm">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                                                Analyzing pixel data...
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {symptoms && (
                                <div className="flex-grow">
                                    <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Reported Symptoms</p>
                                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-2xl" />
                                        <p className="text-gray-700 leading-relaxed text-sm italic">
                                            "{symptoms}"
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            {report?.id && (
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <p className="text-xs text-gray-400 font-mono text-center">
                                        Report ID: {report.id}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <TouchGesture
            onSwipeLeft={() => console.log('Swipe left')}
            onSwipeRight={() => console.log('Swipe right')}
            className="max-w-4xl mx-auto"
        >
            <ScrollAnimation animation="fadeIn" delay={100}>
                <div className="mb-12">
                    <h1 className="text-4xl font-bold font-headline text-gray-900 mb-6">{t('new_report.title')}</h1>
                    <p className="text-lg text-gray-600 leading-relaxed">{t('new_report.subtitle')}</p>
                </div>
            </ScrollAnimation>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <CardHeader className="pb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Upload className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">{t('new_report.form_title')}</CardTitle>
                                <CardDescription className="text-base">{t('new_report.form_subtitle')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Step 1: Image Upload */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                <Label className="text-lg font-semibold">{t('new_report.step1')}</Label>
                            </div>
                            
                            {imagePreview ? (
                                <div className="relative group">
                                    <div className="relative w-full max-w-md mx-auto">
                                        <Image 
                                            src={imagePreview} 
                                            alt="Crop preview" 
                                            width={400} 
                                            height={300} 
                                            className="rounded-xl border-2 border-gray-200 shadow-lg object-cover w-full h-64" 
                                        />
                                        <Button 
                                            variant="destructive" 
                                            size="icon" 
                                            className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" 
                                            onClick={removeImage}
                                        >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    </div>
                                    <p className="text-center text-sm text-gray-500 mt-2">Click the X to remove and upload a different image</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <label htmlFor="image-upload" className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 group">
                                        <div className="flex flex-col items-center justify-center pt-8 pb-8">
                                            <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:scale-110 transition-transform duration-200">
                                                <Upload className="w-8 h-8 text-primary" />
                                            </div>
                                            <p className="mb-2 text-lg font-semibold text-gray-700">
                                                <span className="text-primary">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-sm text-gray-500">PNG, JPG (MAX. 10MB)</p>
                                            <p className="text-xs text-gray-400 mt-2">For best results, ensure good lighting and clear focus</p>
                                        </div>
                                    </label>
                                    <Input 
                                        id="image-upload" 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/png, image/jpeg" 
                                        onChange={handleImageChange} 
                                    />
                                </div>
                            )}
                        </div>

                        {/* Step 2: Details & Symptoms */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                <Label className="text-lg font-semibold">{t('new_report.step2')}</Label>
                            </div>
                            
                            <div className="space-y-4 ml-11">
                                <div className="space-y-2">
                                    <Label htmlFor="crop" className="text-sm font-medium text-gray-700">{t('new_report.crop_type')}</Label>
                                    <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                                        <SelectTrigger id="crop" className="bg-white border-gray-200">
                                            <SelectValue placeholder={t('new_report.auto_detect')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Auto">{t('new_report.auto_detect')}</SelectItem>
                                            <SelectItem value="Wheat">Wheat</SelectItem>
                                            <SelectItem value="Cotton">Cotton</SelectItem>
                                            <SelectItem value="Rice">Rice</SelectItem>
                                            <SelectItem value="Sugarcane">Sugarcane</SelectItem>
                                            <SelectItem value="Maize">Maize (Corn)</SelectItem>
                                            <SelectItem value="Apple">Apple</SelectItem>
                                            <SelectItem value="Mango">Mango</SelectItem>
                                            <SelectItem value="Citrus">Citrus (Kinnow)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-500">
                                        Selecting the specific crop helps the AI provide a more accurate diagnosis, especially for close-up leaf photos.
                                    </p>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="symptoms" className="text-sm font-medium text-gray-700">{t('new_report.symptoms_desc')}</Label>
                                    <Textarea
                                        id="symptoms"
                                        placeholder={t('new_report.symptoms_placeholder')}
                                        value={symptoms}
                                        onChange={(e) => setSymptoms(e.target.value)}
                                    rows={5}
                                maxLength={500}
                                    className="text-base border-2 border-gray-200 focus:border-primary transition-colors rounded-xl resize-none"
                                />
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-500">Include details about affected areas, timing, and any other observations</p>
                                    <span className={`font-medium ${symptoms.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                                        {symptoms.length} / 500
                                    </span>
                                </div>
                            </div>
                        </div>
                        </div>

                        {/* Step 3: Location */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                <Label className="text-lg font-semibold">{t('new_report.step3')}</Label>
                        </div>

                            <div className="flex items-center p-4 rounded-xl border-2 border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                                <MapPin className="h-6 w-6 text-primary mr-4" />
                                <div>
                                    <p className="font-medium text-gray-900">{profile?.location || "Faisalabad, Punjab"}</p>
                                    <p className="text-sm text-gray-600">Auto-detected from your profile</p>
                                </div>
                            </div>
                        </div>

                        {/* Error Display */}
                         {error && (
                            <div className="p-4 bg-red-50 border-2 border-red-200 text-red-800 text-sm rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className="p-1 bg-red-100 rounded-full">
                                        <X className="h-4 w-4" />
                                    </div>
                                    <div>
                                <p className="font-bold">An Error Occurred</p>
                                        <p className="mt-1">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-6">
                            <Button 
                                type="submit" 
                                size="lg" 
                                className="w-full bg-primary hover:bg-primary/90 text-lg py-6 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
                                disabled={!imageFile || isUserLoading || loadingState !== 'idle'}
                            >
                                {loadingState === 'idle' ? (
                                    <>
                                        <Upload className="mr-2 h-5 w-5" />
                                        {t('new_report.submit')}
                                    </>
                                ) : (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Processing...
                                    </>
                                )}
                        </Button>
                            
                            {!imageFile && (
                                <p className="text-center text-sm text-gray-500 mt-3">
                                    Please upload an image to continue
                                </p>
                            )}
                        </div>
                    </CardContent>
                </form>
            </Card>
        </TouchGesture>
    );
}
