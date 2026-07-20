export const BROKER = {
  name: "Aarav Shinde", phone: "+91 98765 43210", zone: "West & Central Pune", rating: 4.9,
};

export const seedProperties = [
  {
    id: "rk-101", title: "Sunlit 2BHK near Osho Garden", locality: "Koregaon Park", type: "Flat", bhk: "2 BHK",
    rent: 32000, deposit: 96000, area: 1080, furnishing: "Semi-furnished", status: "Available", approved: true,
    owner: "Meera Kulkarni", available: "01 Aug 2026", description: "Quiet, cross-ventilated home with a wraparound balcony and quick access to cafés, offices, and the riverside.",
    amenities: ["Covered parking", "Power backup", "Pet friendly", "24/7 security", "Balcony", "Lift"],
    images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85", "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85"]
  },
  {
    id: "rk-102", title: "Skyline 3BHK with work studio", locality: "Baner", type: "Flat", bhk: "3 BHK",
    rent: 42000, deposit: 126000, area: 1480, furnishing: "Fully furnished", status: "Available", approved: true,
    owner: "Rohan Deshpande", available: "Ready now", description: "A polished high-floor residence with a dedicated study, sunset views, and a full-service clubhouse.",
    amenities: ["Clubhouse", "Gym", "2 car parks", "Pool", "Work studio", "Security"],
    images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85", "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85"]
  },
  {
    id: "rk-103", title: "Garden villa in a private lane", locality: "Kothrud", type: "Villa", bhk: "3 BHK",
    rent: 56000, deposit: 168000, area: 2100, furnishing: "Semi-furnished", status: "Available", approved: true,
    owner: "Anita Joshi", available: "15 Aug 2026", description: "Independent villa with a shaded garden, generous family spaces, and a calm lane near Karve Road.",
    amenities: ["Private garden", "Terrace", "Solar water", "2 car parks", "Store room", "Pet friendly"],
    images: ["https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=85", "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1600607688960-e095ff83135c?auto=format&fit=crop&w=1000&q=85"]
  },
  {
    id: "rk-104", title: "Airport-view designer bungalow", locality: "Viman Nagar", type: "Bungalow", bhk: "4 BHK",
    rent: 78000, deposit: 234000, area: 2850, furnishing: "Fully furnished", status: "Available", approved: true,
    owner: "Kabir Bhatia", available: "Ready now", description: "A rare standalone home with layered outdoor spaces, a media room, and fast airport access.",
    amenities: ["Media room", "Terrace", "Private parking", "Housekeeping", "Garden", "Power backup"],
    images: ["https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?auto=format&fit=crop&w=1400&q=85", "https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1000&q=85"]
  }
];

export const initialState = {
  properties: seedProperties,
  unlocks: [{ propertyId: "rk-102", paidAt: "18 Jul 2026" }],
  leads: [{ id: "lead-demo", propertyId: "rk-102", broker: BROKER, status: "Scheduled", visitDate: "22 Jul 2026 · 11:30 AM", visitCount: 1, visitFee: 0, tokenPaid: 0 }],
  ledger: [
    { id: "tx-1", type: "Listing fee", amount: 100, date: "17 Jul 2026", reference: "RK-102", platformShare: 100 },
    { id: "tx-2", type: "Unlock fee", amount: 100, date: "18 Jul 2026", reference: "RK-102", platformShare: 100 }
  ],
  closedDeals: 0,
  totalVisits: 1,
};
