"use client";

import { useState } from "react";
import { useAuth } from "@/firebase";
import { createField } from "@/lib/repositories";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, MapPin, Calendar, Sprout } from "lucide-react";
import Link from "next/link";

export default function NewFieldPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        cropType: "",
        variety: "",
        plantingDate: "",
        location: "",
        growthStage: "",
        notes: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!formData.name || !formData.cropType) {
            toast({ title: "Validation Error", description: "Name and Crop Type are required.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            await createField(user.uid, formData);
            toast({ title: "Field Created", description: "Your field/plot has been successfully added." });
            router.push("/fields");
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to create field.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/fields">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Fields
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold font-headline">Add New Field</h1>
            </div>

            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Field Information</CardTitle>
                    <CardDescription>Register a new plot or field for long-term health tracking.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Field/Plot Name *</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. North Plot, Greenhouse 1" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cropType">Crop Type *</Label>
                                <Select value={formData.cropType} onValueChange={v => setFormData(p => ({...p, cropType: v}))}>
                                    <SelectTrigger id="cropType">
                                        <SelectValue placeholder="Select crop" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Wheat">Wheat</SelectItem>
                                        <SelectItem value="Cotton">Cotton</SelectItem>
                                        <SelectItem value="Rice">Rice</SelectItem>
                                        <SelectItem value="Sugarcane">Sugarcane</SelectItem>
                                        <SelectItem value="Maize">Maize (Corn)</SelectItem>
                                        <SelectItem value="Tomato">Tomato</SelectItem>
                                        <SelectItem value="Potato">Potato</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="variety">Variety/Seed Type</Label>
                                <Input id="variety" name="variety" value={formData.variety} onChange={handleChange} placeholder="e.g. Basmati, BT Cotton" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="growthStage">Current Growth Stage</Label>
                                <Select value={formData.growthStage} onValueChange={v => setFormData(p => ({...p, growthStage: v}))}>
                                    <SelectTrigger id="growthStage">
                                        <SelectValue placeholder="Select stage" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Seedling">Seedling</SelectItem>
                                        <SelectItem value="Vegetative">Vegetative</SelectItem>
                                        <SelectItem value="Flowering">Flowering</SelectItem>
                                        <SelectItem value="Fruiting">Fruiting/Grain Fill</SelectItem>
                                        <SelectItem value="Mature">Mature/Ready for Harvest</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="plantingDate" className="flex items-center gap-2"><Calendar className="w-4 h-4"/> Planting Date</Label>
                                <Input id="plantingDate" name="plantingDate" type="date" value={formData.plantingDate} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location" className="flex items-center gap-2"><MapPin className="w-4 h-4"/> Location Details</Label>
                                <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Sector 4, Near canal" />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes / Previous Treatments</Label>
                            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Any historical diseases, soil conditions, or previous treatments applied." rows={4} />
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
                            {loading ? "Saving..." : <><Save className="mr-2 h-5 w-5"/> Save Field</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
