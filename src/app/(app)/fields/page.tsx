"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/firebase";
import { listFields } from "@/lib/repositories";
import { Field } from "@/lib/models";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { PlusCircle, MapPin, Calendar, Sprout, ArrowRight } from "lucide-react";

export default function FieldsPage() {
    const { user } = useAuth();
    const [fields, setFields] = useState<Field[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        listFields(user.uid).then(data => {
            setFields(data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [user]);

    if (loading) {
        return <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="flex justify-between items-end flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-headline">My Fields & Crops</h1>
                    <p className="text-gray-500 mt-2">Manage your fields and track crop health history over time.</p>
                </div>
                <Button asChild>
                    <Link href="/fields/new">
                        <PlusCircle className="mr-2 w-4 h-4" /> Add Field
                    </Link>
                </Button>
            </div>

            {fields.length === 0 ? (
                <Card className="text-center p-12 bg-gray-50/50 border-dashed">
                    <Sprout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No fields added yet</h3>
                    <p className="text-gray-500 mb-6">Create a field profile to start tracking long-term crop health and disease progression.</p>
                    <Button asChild><Link href="/fields/new">Add Your First Field</Link></Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {fields.map(field => (
                        <Card key={field.id} className="hover:shadow-lg transition-shadow border-0 shadow-md">
                            <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{field.name}</CardTitle>
                                        <CardDescription className="font-medium text-primary mt-1">{field.cropType}</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="bg-white">{field.growthStage || 'Unknown'}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                {field.variety && (
                                    <div className="flex items-center text-sm">
                                        <span className="text-gray-500 w-24">Variety:</span>
                                        <span className="font-medium">{field.variety}</span>
                                    </div>
                                )}
                                {field.plantingDate && (
                                    <div className="flex items-center text-sm">
                                        <span className="text-gray-500 w-24 flex items-center"><Calendar className="w-3 h-3 mr-1"/> Planted:</span>
                                        <span className="font-medium">{new Date(field.plantingDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {field.location && (
                                    <div className="flex items-center text-sm">
                                        <span className="text-gray-500 w-24 flex items-center"><MapPin className="w-3 h-3 mr-1"/> Location:</span>
                                        <span className="font-medium">{field.location}</span>
                                    </div>
                                )}
                                <div className="pt-4 mt-2 border-t flex justify-end">
                                    <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                                        <Link href={`/fields/${field.id}`}>
                                            View Reports <ArrowRight className="ml-2 w-4 h-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
