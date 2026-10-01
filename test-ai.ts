import { instantDiagnosisFromImageAndSymptoms } from './src/ai/flows/instant-diagnosis-from-image-and-symptoms';

async function main() {
    const output = await instantDiagnosisFromImageAndSymptoms({
        photoDataUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAQDAwQDAwQEAwQFBAQFBgoHBgYGBg0JCggKDw0QEA8NDw4RExgUERIGEg4PExoUFhcCGAYGCAoJDg...', // Fake short base64 just to trigger it
        symptoms: 'Yellow spots on leaves',
        crop: 'Unknown'
    });
    console.log(JSON.stringify(output, null, 2));
}

main().catch(console.error);
