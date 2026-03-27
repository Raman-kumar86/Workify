export const TASK_CATEGORIES = [
  {
    id: "electronics",
    label: "Electronics",
    minPrice: 300,
    subCategories: [
      { label: "AC Repair", minPrice: 800 },
      { label: "TV Repair", minPrice: 500 },
      { label: "Washing Machine", minPrice: 600 },
    ],
  },
  {
    id: "plumbing",
    label: "Plumbing",
    minPrice: 200,
    subCategories: [
      { label: "Leak Fix", minPrice: 400 },
      { label: "Pipe Installation", minPrice: 700 },
    ],
  },
];

export const TIME_SLOTS = [
  { label: "8–10 AM", value: "8-10" },
  { label: "10–12 PM", value: "10-12" },
  { label: "12–2 PM", value: "12-2" },
  { label: "2–4 PM", value: "2-4" },
  { label: "4–6 PM", value: "4-6" },
];

export const TASK_FORM_DEFAULTS = {
  taskTitle: "",
  description: "",
  category: "",
  subcategory: "",
  cost: "",
  availabilityDate: "",
  availabilityTimeSlots: [],
  contactNumber: "",
  alternateContactNumber: "",
  images: [],
  address: "",
  location: { lat: null, lng: null },
};

export const PHONE_REGEX = /^[0-9]{10}$/;
export const MAX_DESCRIPTION_LENGTH = 500;

export const getGeolocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
      );
    }
  });
};

export const WORKER_API_ENDPOINTS = {
  GET_AVAILABLE_TASKS: "/api/worker/tasks/available",
  SET_AVAILABILITY: "/api/worker/availability",
};

export const DISTANCE_OPTIONS = [
  { label: "10 km", value: 10 },
  { label: "20 km", value: 20 },
  { label: "100 km", value: 100 },
];

export const categories = [
    {
      id: 1,
      name: "Maintenance & Repair",
      rating: 4.8,
      completed: "1.2k+",
      image:
        "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800&sat=-100",
    },
    {
      id: 2,
      name: "Construction & Renovation",
      rating: 4.9,
      completed: "850+",
      image:
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800&sat=-100",
    },
    {
      id: 3,
      name: "Household & Lifestyle",
      rating: 4.7,
      completed: "2.5k+",
      image:
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800&sat=-100",
    },
    {
      id: 5,
      name: "Design & Installation",
      rating: 4.9,
      completed: "400+",
      image:
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800&sat=-100",
    },
  ];