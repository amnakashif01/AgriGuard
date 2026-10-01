import { InstantDiagnosisFromImageAndSymptomsOutput } from "@/ai/flows/instant-diagnosis-from-image-and-symptoms";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Bot, AlertTriangle, Leaf } from "lucide-react";
import CropImageHighlights from "./crop-image-highlights";

type DiagnosisCardProps = {
    diagnosis: InstantDiagnosisFromImageAndSymptomsOutput;
    imageUrl: string;
};

export default function DiagnosisCard({ diagnosis, imageUrl }: DiagnosisCardProps) {
    const getConfidenceColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800';
        if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800';
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800';
    };

    const getSeverityVariant = (severity: 'None' | 'Low' | 'Medium' | 'High') => {
        switch (severity) {
            case 'None': return 'outline'; // Healthy plant - minimal visual emphasis
            case 'High': return 'destructive';
            case 'Medium': return 'secondary';
            case 'Low': return 'default';
        }
    };
    
    const isNotCrop = diagnosis.disease.toLowerCase().includes('not a crop');
    
    return (
        <Card className="overflow-hidden shadow-xl border-0 bg-gradient-to-br from-white to-green-50/30">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-emerald-50 border-b border-primary/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl text-gray-900">AI Analysis: {diagnosis.disease}</CardTitle>
                        <CardDescription className="text-base">
                            Crop: <span className="font-semibold text-primary">{diagnosis.crop}</span> • Generated on {new Date().toLocaleString()}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Image Section */}
                    <div className="space-y-4">
                        <div className="relative w-full overflow-hidden rounded-xl shadow-lg transition-shadow duration-300 bg-black/5">
                            <CropImageHighlights
                                src={imageUrl}
                                alt="Uploaded crop with detected affected areas highlighted"
                                highlights={diagnosis.visualHighlights}
                                showEmptyState={!isNotCrop && diagnosis.severity !== 'None'}
                            />
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                                <span className="text-sm font-medium text-gray-700">Uploaded Image</span>
                            </div>
                        </div>
                        
                        {/* List out all reasonings below the image instead of cluttering the image itself */}
                        {(diagnosis.visualHighlights || []).length > 0 && (
                            <div className="mt-3 space-y-2">
                                {(diagnosis.visualHighlights || []).map((highlight, idx) => (
                                    highlight.reasoning && (
                                        <div key={idx} className="text-sm text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-100 flex items-start gap-2 shadow-sm transition-all hover:shadow-md">
                                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                            <p className="font-medium">
                                                <span className="font-bold text-amber-900 mr-2">Target {idx + 1}:</span>
                                                {highlight.reasoning}
                                            </p>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Diagnosis Details */}
                    <div className="space-y-6">
                        {!isNotCrop && (
                            <>
                                {/* Confidence Score */}
                                <div className={cn("p-6 rounded-xl border-2 shadow-lg", getConfidenceColor(diagnosis.confidence))}>
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-lg font-semibold">Confidence Score</p>
                                        <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center">
                                            <span className="text-2xl font-bold">{diagnosis.confidence}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-white/30 rounded-full h-3">
                                        <div 
                                            className="bg-current h-3 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${diagnosis.confidence}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Severity and Affected Parts */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            Severity Level
                                        </h4>
                                        <Badge 
                                            variant={getSeverityVariant(diagnosis.severity)} 
                                            className="text-sm px-3 py-1"
                                        >
                                            {diagnosis.severity}
                                        </Badge>
                                    </div>
                                    
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <Leaf className="h-4 w-4 text-emerald-600" />
                                            Affected Parts
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {diagnosis.affectedParts.map((part, index) => (
                                                <Badge key={index} variant="secondary" className="text-sm px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 shadow-sm transition-colors">
                                                    {part}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Description */}
                        {isNotCrop ? (
                            <div className="bg-blue-50/50 backdrop-blur-sm rounded-xl p-6 border border-blue-100 shadow-sm">
                                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                    <Bot className="h-5 w-5 text-blue-500" />
                                    Image Analysis
                                </h3>
                                <p className="text-blue-800 leading-relaxed">
                                    This image does not appear to show a plant or crop. Our AI is specialized in diagnosing plant diseases and identifying crops. Please upload a clear photo of a plant leaf, stem, or fruit for an accurate diagnosis.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    Detailed Analysis
                                </h3>
                                <p className="text-gray-700 leading-relaxed">
                                    {diagnosis.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
