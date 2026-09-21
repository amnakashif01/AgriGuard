"use client";

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n/config';
import { useAuth } from '@/firebase';
import { getProfile } from '@/lib/repositories';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            getProfile(user.uid).then(profile => {
                if (profile?.language) {
                    i18n.changeLanguage(profile.language);
                    document.documentElement.lang = profile.language === 'urdu' ? 'ur' : 'en';
                    document.documentElement.dir = profile.language === 'urdu' ? 'rtl' : 'ltr';
                }
            }).catch(() => {
                // Ignore offline errors
            });
        }
    }, [user]);

    return (
        <I18nextProvider i18n={i18n}>
            {children}
        </I18nextProvider>
    );
}
