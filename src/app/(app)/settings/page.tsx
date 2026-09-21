'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/firebase";
import { getProfile, upsertProfile } from "@/lib/repositories";
import { useEffect, useState } from "react";
import { UserProfile } from "@/lib/models";
import { useToast } from "@/hooks/use-toast";
import { Globe, Save, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n/config";

export default function SettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [language, setLanguage] = useState<'english' | 'urdu'>('english');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        if (user) {
            getProfile(user.uid).then((p) => {
                if (p) {
                    setProfile(p);
                    if (p.language) {
                        setLanguage(p.language);
                    }
                }
                setIsLoading(false);
            });
        }
    }, [user]);

    const handleSaveSettings = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await upsertProfile({
                uid: user.uid,
                phone: profile?.phone || '',
                language: language
            });
            i18n.changeLanguage(language);
            document.documentElement.lang = language === 'urdu' ? 'ur' : 'en';
            document.documentElement.dir = language === 'urdu' ? 'rtl' : 'ltr';
            toast({
                title: t('settings.saved'),
                description: t('settings.saved'),
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to save settings. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">{t('settings.title')}</h1>
                <p className="text-gray-500 mt-2">{t('settings.subtitle')}</p>
            </div>

            <Card className="border-green-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-green-600" />
                        {t('settings.lang_prefs')}
                    </CardTitle>
                    <CardDescription>
                        {t('settings.lang_desc')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="language">{t('settings.lang_label')}</Label>
                        <Select value={language} onValueChange={(v: 'english' | 'urdu') => setLanguage(v)}>
                            <SelectTrigger id="language" className="w-full md:w-[300px]">
                                <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="english">English</SelectItem>
                                <SelectItem value="urdu">Urdu (اردو)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500 mt-2">
                            When Urdu is selected, the application and AI will translate instructions into Urdu.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t justify-end py-4">
                    <Button 
                        onClick={handleSaveSettings} 
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {t('settings.save')}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
