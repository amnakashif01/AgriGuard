# AgriGuard (AgriSahayak) — Project Knowledge Base

## What is AgriGuard?

AgriGuard, also known as AgriSahayak (meaning "Agriculture Helper"), is an AI-powered agricultural assistant web application built specifically for Pakistani farmers. It is a Final Year Project (FYP) developed by Ayesha and Amna. The platform uses a multi-agent AI system powered by Google Gemini AI and Firebase Genkit to help farmers diagnose crop diseases, receive treatment plans, find nearby suppliers, and get weather alerts.

## What Problem Does It Solve?

Pakistani farmers face major agricultural challenges:
- 30 to 40 percent crop loss due to delayed disease detection.
- There is only 1 agricultural expert available for every 5,000 farmers.
- Farmers typically wait 2 to 3 days for expert consultation.
- Around 70 percent of farmers face a language barrier since they speak Urdu or Punjabi, not English.
- Pakistan suffers approximately 3 billion dollars in annual losses due to crop diseases.

AgriGuard solves these problems by providing instant AI-powered crop diagnosis in under 3 seconds, personalized treatment plans with local product names and costs in PKR, a marketplace to find nearby agricultural suppliers, proactive weather alerts, and full bilingual support in both English and Urdu.

## How Does the Project Work?

AgriGuard uses 5 specialized AI agents plus a coordinator agent:

1. Image Processing Agent: Uses Gemini 2.0 Flash Vision to analyze crop images instantly.
2. Diagnostic Agent: Combines image analysis with symptom descriptions and a RAG knowledge base for accurate disease identification.
3. Treatment Plan Agent: Generates step-by-step treatment protocols with local Pakistani product names and costs in PKR.
4. Marketplace Agent: Finds verified agricultural suppliers within a 50 kilometer radius using Google Places API, OpenStreetMap, and a curated backup list.
5. Weather Alert Agent: Provides proactive weather monitoring with geofencing within a 50 kilometer radius.
6. Coordinator Agent: Orchestrates all agents, manages task queues, handles priority routing, and monitors performance.

## Technology Stack

- Frontend: Next.js 15 with App Router, React 18, TypeScript 5, Tailwind CSS, and Shadcn UI components.
- AI and ML: Firebase Genkit AI, Google Gemini Pro for text, Google Gemini 2.0 Flash Vision for images, and RAG (Retrieval-Augmented Generation).
- Backend: Firebase Cloud Functions with Node.js 20 and Next.js API Routes.
- Database: Firebase Firestore, a real-time NoSQL database.
- Authentication: Firebase Auth using phone OTP with reCAPTCHA and Pakistan +92 prefix.
- External APIs: Google Places API, OpenStreetMap Overpass API, and Weather API.

## How Can a Person Use AgriGuard?

### Step 1: Login
Users sign in using their phone number with OTP verification. The system uses the Pakistan +92 country prefix. After entering your phone number, you receive an OTP code to verify your identity.

### Step 2: Dashboard
After logging in, you land on the dashboard which shows a welcome greeting, your recent diagnosis reports, weather alerts for your location, notifications, quick action buttons, and key statistics like total reports, success rate, high priority alerts, and monthly activity.

### Step 3: Create a New Diagnosis Report
Go to "New Report" from the sidebar or dashboard. Upload a photo of your crop (PNG or JPG format, maximum 10 MB). Describe the symptoms you have observed. Optionally select the crop type from options like Cotton, Wheat, Rice, Sugarcane, or Maize. Click submit to start the AI analysis.

### Step 4: AI Analysis and Results
The AI processes your crop image and symptoms in approximately 2 to 3 seconds. You receive the disease name, a confidence score (85 percent or higher accuracy), severity level (None, Low, Medium, or High), affected plant parts, and a detailed description of the disease.

### Step 5: Get Treatment Plan
After diagnosis, a personalized treatment plan is generated with step-by-step protocols including timing (Day 1, Day 3, Week 2), local product names (such as Confidor 200SL), costs in PKR (around Rs. 800 to 1200 per acre), application methods in Urdu or English, and safety warnings and precautions.

### Step 6: Find Suppliers
Use the Marketplace section to find nearby agricultural suppliers. The system uses a three-tier fallback: first Google Places API, then OpenStreetMap, then 8 curated Pakistani companies as backup. You can see distance, ratings, contact information, and connect directly via phone call or WhatsApp.

### Step 7: Weather Alerts
The system automatically monitors weather conditions for your location. You receive crop-specific recommendations and proactive alerts. Monitoring happens every 6 hours within a 50 kilometer geofenced radius.

## Main Pages and Features

- Home Page: Landing page with project introduction, features overview, how it works section, and sign in or get started buttons.
- Login Page: Phone number authentication with OTP verification.
- Dashboard: Overview with statistics, recent reports, weather alerts, notifications, and quick actions.
- New Report: Form to upload crop images, describe symptoms, and get AI diagnosis.
- Report Detail: View complete diagnosis results, treatment plans, and connect with suppliers.
- Marketplace: Find and contact nearby agricultural suppliers.
- Profile: Manage your name, location, preferred language (English or Urdu), and crop preferences.
- Admin: View system logs, agent decisions, and coordinator activity.
- Settings: Application preferences and configuration.

## Report Functionality

Reports in AgriGuard go through these status stages:
- Pending: Report created but not yet processed.
- Processing: AI is actively analyzing the crop image and symptoms.
- Complete: Diagnosis and treatment plan are ready.
- Error: Analysis failed and can be retried.

Each report contains the crop image, identified crop name, disease name, confidence score, severity level, affected parts description, and a treatment plan with steps, costs, and safety guidelines.

Users can view all their past reports from the dashboard. Reports are stored in Firebase Firestore under each user's account and persist across sessions. If a report fails, users can retry the AI diagnosis from the recent reports table.

## Frequently Asked Questions

**Q: What types of crops does AgriGuard support?**
A: AgriGuard can analyze any crop image, but it has preset support for Cotton, Wheat, Rice, Sugarcane, and Maize which are the most common crops in Pakistan.

**Q: How accurate is the AI diagnosis?**
A: The AI diagnosis achieves 85 percent or higher accuracy using Google Gemini 2.0 Flash Vision combined with a RAG knowledge base.

**Q: What languages does AgriGuard support?**
A: AgriGuard supports both English and Urdu. Users can set their preferred language in their profile settings.

**Q: How fast is the diagnosis?**
A: The AI analysis typically completes in 2 to 3 seconds after image upload.

**Q: Is AgriGuard free to use?**
A: Yes, AgriGuard is a free platform built as a Final Year Project to help Pakistani farmers.

**Q: What image formats are supported?**
A: AgriGuard accepts PNG and JPG image formats with a maximum file size of 10 MB. For best results, ensure good lighting and clear focus when photographing your crops.

**Q: How do I find suppliers near me?**
A: Go to the Marketplace section. The system automatically searches for agricultural suppliers within a 50 kilometer radius of your location using Google Places API, OpenStreetMap, or curated supplier data.

**Q: Can I contact suppliers directly?**
A: Yes, you can call suppliers directly or reach them via WhatsApp from the marketplace page.

**Q: How do weather alerts work?**
A: Weather alerts are automatically generated based on your location. The system monitors conditions every 6 hours and provides crop-specific recommendations within a 50 kilometer geofenced radius.

**Q: Who developed AgriGuard?**
A: AgriGuard was developed by Ayesha and Amna as their Final Year Project (FYP). It was built for the Innovista Agentic AI Hackathon Track 2.

**Q: What happens if the AI diagnosis fails?**
A: If a diagnosis fails, the report status changes to Error. You can retry the diagnosis by clicking the Retry AI button in the recent reports table on the dashboard.

**Q: Do I need to create an account?**
A: Yes, you need to sign in using your phone number with OTP verification to use AgriGuard features like creating reports and accessing the dashboard.

**Q: Is my data secure?**
A: Yes, AgriGuard uses Firebase Authentication with phone OTP and reCAPTCHA for security. Your data is stored in Firebase Firestore with proper access controls.

**Q: Can I use AgriGuard on my mobile phone?**
A: Yes, AgriGuard is designed with a mobile-first approach and works on all devices including mobile phones, tablets, and desktop computers.

**Q: What is the treatment plan cost?**
A: Treatment plan costs are shown in Pakistani Rupees (PKR). Typical costs range from Rs. 800 to Rs. 1200 per acre depending on the disease and required treatment products.
