
import { Supplier } from "./models";

export type Report = {
  id: string;
  crop: string;
  diagnosis: string;
  status: 'Complete' | 'Processing' | 'Error';
  imageUrl: string;
  date: string;
};

export const mockSuppliers: Omit<Supplier, 'id'>[] = [
    {
      name: "Punjab Seed Corporation",
      location: { address: "Faisalabad", city: "Faisalabad", province: "Punjab", coordinates: { lat: 31.4187, lng: 73.0791 } },
      distance: 5.2,
      products: ["Fungicide XYZ", "Sprayer"],
      services: ["Delivery"],
      availability: "available",
      pricing: { competitive: true },
      verification: { verified: true },
      rating: 4.5,
      contact: { phone: "+923001234567", whatsapp: "+923001234567" },
      type: "supplier",
    },
    {
      name: "Faisalabad Kisan Store",
      location: { address: "Faisalabad", city: "Faisalabad", province: "Punjab", coordinates: { lat: 31.4187, lng: 73.0791 } },
      distance: 8.1,
      products: ["Pesticide ABC", "Gloves"],
      services: ["Consultation"],
      availability: "available",
      pricing: { competitive: true },
      verification: { verified: false },
      rating: 4.2,
      contact: { phone: "+923017654321", whatsapp: "+923017654321" },
      type: "supplier",
    },
    {
      name: "Chaudhry Agro Services",
      location: { address: "Faisalabad", city: "Faisalabad", province: "Punjab", coordinates: { lat: 31.4187, lng: 73.0791 } },
      distance: 12.5,
      products: ["Fungicide XYZ", "Pesticide ABC", "Sprayer"],
      services: ["Delivery", "Equipment Rental"],
      availability: "available",
      pricing: { competitive: false, notes: "Premium pricing" },
      verification: { verified: true },
      rating: 4.8,
      contact: { phone: "+923335556677", whatsapp: "+923335556677" },
      type: "supplier",
    }
];

export const mockRecentReports: Report[] = [
  {
    id: '1',
    crop: 'Cotton',
    diagnosis: 'Cotton Leaf Curl Virus',
    status: 'Complete',
    imageUrl: 'https://picsum.photos/seed/101/100/100',
    date: '2 days ago',
  },
  {
    id: '2',
    crop: 'Wheat',
    diagnosis: 'Yellow Rust',
    status: 'Complete',
    imageUrl: 'https://picsum.photos/seed/102/100/100',
    date: '5 days ago',
  },
  {
    id: '3',
    crop: 'Rice',
    diagnosis: 'Processing...',
    status: 'Processing',
    imageUrl: 'https://picsum.photos/seed/103/100/100',
    date: '1 hour ago',
  },
  {
    id: '4',
    crop: 'Sugarcane',
    diagnosis: 'Red Rot',
    status: 'Error',
    imageUrl: 'https://picsum.photos/seed/104/100/100',
    date: '1 week ago',
  },
];
