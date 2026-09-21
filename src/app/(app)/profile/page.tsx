
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/firebase";
import { getProfile, upsertProfile } from "@/lib/repositories";
import { useToast } from "@/hooks/use-toast";
import i18n from "@/lib/i18n/config";
import { sendWeatherAlert, sendDiseaseWarning, sendMarketUpdate } from "@/lib/notifications";

export default function ProfilePage() {
    const presetCrops = ["Cotton", "Wheat", "Rice", "Sugarcane", "Maize"];
    const { user } = useAuth();
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [language, setLanguage] = useState<"english" | "urdu">("english");
    const [crops, setCrops] = useState<string[]>([]);
    const [phone, setPhone] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);
    const [notificationPreferences, setNotificationPreferences] = useState({
        weatherAlerts: true,
        priceUpdates: false,
        treatmentReminders: true,
    });

    useEffect(() => {
        let cancel = false;
        if (user) {
            getProfile(user.uid).then(p => {
                if (cancel) return;
                if (p) {
                    setName(p.name ?? "");
                    setLocation(p.location ?? "Faisalabad, Punjab");
                    setPhone(p.phone || user.phoneNumber || "");
                    setLanguage((p.language as any) ?? "english");
                    setCrops(p.crops ?? []);
                    setNotificationPreferences({
                        weatherAlerts: p.notificationPreferences?.weatherAlerts ?? true,
                        priceUpdates: p.notificationPreferences?.priceUpdates ?? false,
                        treatmentReminders: p.notificationPreferences?.treatmentReminders ?? true,
                    });
                }
            });
        }
        return () => { cancel = true; };
    }, [user]);

    const toggleCrop = (crop: string) => {
        setCrops(prev => prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop]);
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSavingProfile(true);
        try {
            // Only save personal information fields
            await upsertProfile({ uid: user.uid, phone, name, location });
            toast({ title: "Profile Saved", description: "Your personal information has been updated." });
            window.dispatchEvent(new Event('profileUpdated'));
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSavePreferences = async () => {
        if (!user) return;
        setIsSavingPrefs(true);
        try {
            // Only save preferences fields
            await upsertProfile({ uid: user.uid, phone, language, crops, notificationPreferences });
            i18n.changeLanguage(language);
            document.documentElement.lang = language === 'urdu' ? 'ur' : 'en';
            document.documentElement.dir = language === 'urdu' ? 'rtl' : 'ltr';
            toast({ title: "Preferences Saved", description: "Your preferences have been updated." });
            window.dispatchEvent(new Event('profileUpdated'));
        } finally {
            setIsSavingPrefs(false);
        }
    };

    const handleTestNotification = async (type: 'weather' | 'disease' | 'market') => {
        if (!user) {
            toast({ title: "Error", description: "You must be logged in to send notifications", variant: "destructive" });
            return;
        }

        try {
            switch (type) {
                case 'weather':
                    await sendWeatherAlert(user.uid, location || 'Faisalabad', 'Heavy rainfall expected in the next 24 hours. Protect sensitive crops.', 'high');
                    toast({ title: "Notification Sent", description: "A test weather alert has been sent to your notifications panel." });
                    break;
                case 'disease':
                    await sendDiseaseWarning(user.uid, crops[0] || 'Wheat', 'Leaf Rust', location || 'your area');
                    toast({ title: "Notification Sent", description: "A test disease warning has been sent to your notifications panel." });
                    break;
                case 'market':
                    await sendMarketUpdate(user.uid, crops[0] || 'Wheat', '4,200 PKR/40kg', 'up');
                    toast({ title: "Notification Sent", description: "A test market update has been sent to your notifications panel." });
                    break;
            }
        } catch (error) {
            console.error('Failed to send test notification:', error);
            toast({ title: "Error", description: "Failed to send notification. Check console.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold font-headline">Profile Settings</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your photo and personal details here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-center gap-6">
                        <div className="relative">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/200/200`} data-ai-hint="person" />
                                <AvatarFallback>{name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <Button size="icon" className="absolute bottom-0 end-0 rounded-full h-8 w-8">
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="grid gap-2 flex-grow">
                           <div className="grid w-full max-w-sm items-center gap-1.5">
                              <Label htmlFor="name">Full Name</Label>
                              <Input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />
                           </div>
                           <div className="grid w-full max-w-sm items-center gap-1.5">
                              <Label htmlFor="location">Location</Label>
                              <Input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
                           </div>
                        </div>
                     </div>
                     <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                     </div>
                     <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                        {isSavingProfile ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                        {isSavingProfile ? "Saving..." : "Save Changes"}
                     </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Manage your language, crop, and notification settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="language">Preferred Language</Label>
                        <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
                            <SelectTrigger id="language">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="english">English</SelectItem>
                                <SelectItem value="urdu">اردو</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Crops Grown</Label>
                        <div className="flex flex-wrap gap-2">
                            {presetCrops.map(crop => (
                                <Button key={crop} variant={crops.includes(crop) ? "secondary" : "outline"} className="rounded-full" onClick={() => toggleCrop(crop)}>{crop}</Button>
                            ))}
                        </div>
                    </div>

                    <Separator />
                    
                    <div className="space-y-4">
                        <h3 className="text-md font-medium">Notification Preferences</h3>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="weather-alerts" className="flex flex-col gap-1">
                                <span>Weather Alerts</span>
                                <span className="text-xs text-muted-foreground">Receive alerts for critical weather conditions.</span>
                            </Label>
                            <Switch id="weather-alerts" checked={notificationPreferences.weatherAlerts} onCheckedChange={(checked) => setNotificationPreferences(prev => ({ ...prev, weatherAlerts: checked }))}/>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="price-updates" className="flex flex-col gap-1">
                                <span>Price Updates</span>
                                <span className="text-xs text-muted-foreground">Get notified about market price changes for your crops.</span>
                            </Label>
                            <Switch id="price-updates" checked={notificationPreferences.priceUpdates} onCheckedChange={(checked) => setNotificationPreferences(prev => ({ ...prev, priceUpdates: checked }))}/>
                        </div>
                         <div className="flex items-center justify-between">
                            <Label htmlFor="reminders" className="flex flex-col gap-1">
                                <span>Treatment Reminders</span>
                                <span className="text-xs text-muted-foreground">Reminders for steps in your treatment plans.</span>
                            </Label>
                            <Switch id="reminders" checked={notificationPreferences.treatmentReminders} onCheckedChange={(checked) => setNotificationPreferences(prev => ({ ...prev, treatmentReminders: checked }))}/>
                        </div>
                    </div>
                    <Button onClick={handleSavePreferences} disabled={isSavingPrefs}>
                        {isSavingPrefs ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                        {isSavingPrefs ? "Saving..." : "Save Preferences"}
                     </Button>
                </CardContent>
            </Card>

            <Card className="border-emerald-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-emerald-700">Test Notifications</CardTitle>
                    <CardDescription>Click the buttons below to simulate receiving notifications in your dashboard panel.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Since automated background checks are not enabled, use these buttons to test the notification system.</p>
                    <div className="flex flex-wrap gap-4">
                        <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => handleTestNotification('weather')}>
                            Test Weather Alert
                        </Button>
                        <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleTestNotification('disease')}>
                            Test Disease Warning
                        </Button>
                        <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => handleTestNotification('market')}>
                            Test Market Update
                        </Button>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
