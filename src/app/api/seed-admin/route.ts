import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore';
import { collection, doc, setDoc } from 'firebase/firestore';

export async function GET() {
    try {
        const db = getDb();
        
        // 1. Create some dummy users (profiles)
        for (let i = 1; i <= 5; i++) {
            await setDoc(doc(db, 'profiles', `demo-user-${i}`), {
                uid: `demo-user-${i}`,
                name: `FYP User ${i}`,
                phone: `+92300000000${i}`,
                location: 'Punjab, Pakistan',
                createdAt: new Date().toISOString()
            }, { merge: true });
        }

        // 2. Create dummy logs for the graph (spread across last 7 days)
        const logsRef = collection(db, 'logs');
        let totalCreated = 0;

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Generate 1-4 reports per day
            const reportsCount = Math.floor(Math.random() * 4) + 1;
            
            for (let j = 0; j < reportsCount; j++) {
                // Vary the time throughout the day
                const logDate = new Date(date);
                logDate.setHours(Math.floor(Math.random() * 24));
                logDate.setMinutes(Math.floor(Math.random() * 60));

                const logDoc = doc(logsRef);
                await setDoc(logDoc, {
                    id: logDoc.id,
                    agentName: 'Image Diagnostics',
                    action: 'diagnosis_completed',
                    payload: {
                        confidence: Math.floor(Math.random() * 20) + 75, // 75-95%
                    },
                    status: 'success',
                    duration: Math.floor(Math.random() * 5000) + 3000, // 3-8 seconds
                    timestamp: logDate.toISOString()
                });
                totalCreated++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Successfully seeded ${totalCreated} logs and 5 users for the Admin Dashboard!` 
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
