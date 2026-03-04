export const hospitalSnapshot = {
  totalBeds: 420,
  availableBeds: 68,
  icuAvailable: 6,
  erQueue: 23,
  avgWaitMins: 38,
  alertLevel: "moderate", // low | moderate | high
};

export const departments = [
  { name: "Emergency", availableBeds: 8, capacity: 60, status: "busy" },
  { name: "ICU", availableBeds: 6, capacity: 24, status: "tight" },
  { name: "General Ward", availableBeds: 44, capacity: 240, status: "stable" },
  { name: "Pediatrics", availableBeds: 6, capacity: 42, status: "stable" },
  { name: "Surgery", availableBeds: 4, capacity: 54, status: "busy" },
];

export const beds = [
  { id: "B-01", ward: "General Ward", type: "Standard", status: "Occupied" },
  { id: "B-02", ward: "General Ward", type: "Standard", status: "Available" },
  { id: "ICU-03", ward: "ICU", type: "ICU", status: "Available" },
  { id: "ER-04", ward: "Emergency", type: "Observation", status: "Occupied" },
];

export const emergencyQueue = [
  { ticket: "E-1029", priority: "Critical", etaMins: 2, notes: "Chest pain" },
  { ticket: "E-1030", priority: "High", etaMins: 8, notes: "Severe bleeding" },
  { ticket: "E-1031", priority: "Medium", etaMins: 20, notes: "Fever + dehydration" },
  { ticket: "E-1032", priority: "Low", etaMins: 45, notes: "Minor injury" },
];
