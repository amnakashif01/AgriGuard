"use client";

import { useEffect, useState } from "react";
import { useAuth, useFirebase } from "@/firebase";
import { getField } from "@/lib/repositories";
import { Field, DiagnosisReport } from "@/lib/models";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, Sprout, Shield, ShieldAlert, CheckCircle, ArrowRight } from "lucide-react";

export default function FieldProfilePage() {
    const { user } = useAuth();
    const { db } = useFirebase();
    const params = useParams();
    const fieldId = params.id as string;
    
    const [field, setField] = useState<Field | null>(null);
    const [reports, setReports] = useState<DiagnosisReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !db || !fieldId) return;
        
        const loadFieldData = async () => {
            try {
                const fieldData = await getField(user.uid, fieldId);
                if (fieldData) setField(fieldData);

                const reportsRef = collection(db, 'users', user.uid, 'reports');
                const q = query(reportsRef, where('fieldId', '==', fieldId), orderBy('createdAt', 'desc'));
                const snap = await getDocs(q);
                setReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as DiagnosisReport)));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        
        loadFieldData();
    }, [user, db, fieldId]);

    if (loading) return <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    
    if (!field) return <div className="p-12 text-center text-red-500">Field not found</div>;

    const getHealthBadge = (report: DiagnosisReport) => {
        const isHealthy = report.disease?.toLowerCase().includes("healthy") || report.severity === "None";
        if (isHealthy) return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1"/> Healthy</Badge>;
        if (report.severity === "High") return <Badge variant="destructive" className="bg-red-500"><ShieldAlert className="w-3 h-3 mr-1"/> At Risk</Badge>;
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800"><Shield className="w-3 h-3 mr-1"/> Diseased</Badge>;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/fields">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Fields
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold font-headline">Field Profile</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-t-xl">
                            <CardTitle className="text-2xl">{field.name}</CardTitle>
                            <Badge className="w-fit mt-2 bg-primary text-white">{field.cropType}</Badge>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {field.variety && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Variety</p>
                                    <p className="font-medium">{field.variety}</p>
                                </div>
                            )}
                            {field.growthStage && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Growth Stage</p>
                                    <p className="font-medium">{field.growthStage}</p>
                                </div>
                            )}
                            {field.plantingDate && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1 flex items-center"><Calendar className="w-3 h-3 mr-1"/> Planting Date</p>
                                    <p className="font-medium">{new Date(field.plantingDate).toLocaleDateString()}</p>
                                </div>
                            )}
                            {field.location && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1 flex items-center"><MapPin className="w-3 h-3 mr-1"/> Location</p>
                                    <p className="font-medium">{field.location}</p>
                                </div>
                            )}
                            {field.notes && (
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                                    <p className="text-sm italic">{field.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    <Button asChild className="w-full" size="lg">
                        <Link href={`/report/new?fieldId=${field.id}`}>
                            New Diagnosis for this Field
                        </Link>
                    </Button>
                </div>

                <div className="md:col-span-2">
                    <Card className="border-0 shadow-md h-full">
                        <CardHeader className="border-b border-gray-100">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Sprout className="w-5 h-5 text-primary" />
                                Monitoring Timeline
                            </CardTitle>
                            <CardDescription>Chronological history of all reports for this field</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {reports.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p>No reports found for this field yet.</p>
                                </div>
                            ) : (
                                <div className="relative border-l-2 border-gray-200 ml-4 pl-6 space-y-8">
                                    {reports.map((report, idx) => (
                                        <div key={report.id} className="relative">
                                            <div className="absolute -left-[33px] top-2 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
                                                {report.imageThumb && (
                                                    <div className="relative w-full sm:w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                                        <Image src={report.imageThumb} alt="Crop" fill className="object-cover" unoptimized/>
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                                                        <div>
                                                            <h3 className="font-bold text-lg">{report.disease}</h3>
                                                            <p className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                        {getHealthBadge(report)}
                                                    </div>
                                                    {report.severity !== 'None' && report.disease !== 'Unknown Crop' && (
                                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{report.description}</p>
                                                    )}
                                                    <div className="mt-3 flex justify-end">
                                                        <Button asChild size="sm" variant="outline" className="text-xs h-8">
                                                            <Link href={`/report/${report.id}`}>
                                                                View Report <ArrowRight className="w-3 h-3 ml-1" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
