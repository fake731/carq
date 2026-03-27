export type UserRole = "customer" | "garage" | "admin";

export type CarStatus = "received" | "inspecting" | "repairing" | "waiting_parts" | "ready";

export const statusLabels: Record<CarStatus, string> = {
  received: "تم الاستلام",
  inspecting: "قيد الفحص",
  repairing: "قيد التصليح",
  waiting_parts: "بانتظار قطع",
  ready: "جاهزة",
};

export const statusColors: Record<CarStatus, string> = {
  received: "status-received",
  inspecting: "status-inspecting",
  repairing: "status-repairing",
  waiting_parts: "status-waiting",
  ready: "status-ready",
};

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  color: string;
  ownerName: string;
  ownerPhone: string;
  status: CarStatus;
  estimatedCost: number;
  estimatedTime: string;
  notes: string;
  garageId: string;
  images: string[];
  updates: CarUpdate[];
}

export interface CarUpdate {
  id: string;
  timestamp: string;
  status: CarStatus;
  message: string;
  images?: string[];
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  username: string;
  role: UserRole;
  garageId?: string;
  garageName?: string;
  isPremium?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "status" | "message" | "photo" | "system";
}

export const mockCars: Car[] = [
  {
    id: "1",
    make: "تويوتا",
    model: "كامري",
    year: 2022,
    plateNumber: "أ ب ج 1234",
    color: "أبيض",
    ownerName: "أحمد بن سعيد الحارثي",
    ownerPhone: "96812345",
    status: "repairing",
    estimatedCost: 450,
    estimatedTime: "3 أيام",
    notes: "تغيير فلتر الزيت + فحص الفرامل",
    garageId: "g1",
    images: [],
    updates: [
      { id: "u1", timestamp: "2026-03-25 10:00", status: "received", message: "تم استلام السيارة" },
      { id: "u2", timestamp: "2026-03-25 14:00", status: "inspecting", message: "بدأنا الفحص الشامل" },
      { id: "u3", timestamp: "2026-03-26 09:00", status: "repairing", message: "تم تحديد المشكلة وبدأنا التصليح" },
    ],
  },
  {
    id: "2",
    make: "نيسان",
    model: "باترول",
    year: 2023,
    plateNumber: "د هـ و 5678",
    color: "أسود",
    ownerName: "سالم بن خالد البلوشي",
    ownerPhone: "96887654",
    status: "waiting_parts",
    estimatedCost: 1200,
    estimatedTime: "5 أيام",
    notes: "مشكلة في علبة التروس - بانتظار قطعة غيار",
    garageId: "g1",
    images: [],
    updates: [
      { id: "u4", timestamp: "2026-03-24 08:00", status: "received", message: "تم استلام السيارة" },
      { id: "u5", timestamp: "2026-03-24 16:00", status: "inspecting", message: "فحص أولي" },
      { id: "u6", timestamp: "2026-03-25 11:00", status: "waiting_parts", message: "نحتاج قطعة غيار من الوكالة" },
    ],
  },
  {
    id: "3",
    make: "هوندا",
    model: "أكورد",
    year: 2021,
    plateNumber: "ز ح ط 9012",
    color: "فضي",
    ownerName: "محمد بن علي الريامي",
    ownerPhone: "96898765",
    status: "ready",
    estimatedCost: 200,
    estimatedTime: "يوم واحد",
    notes: "تغيير بطارية + فحص كهرباء",
    garageId: "g2",
    images: [],
    updates: [
      { id: "u7", timestamp: "2026-03-26 09:00", status: "received", message: "تم الاستلام" },
      { id: "u8", timestamp: "2026-03-26 12:00", status: "repairing", message: "جاري التغيير" },
      { id: "u9", timestamp: "2026-03-26 16:00", status: "ready", message: "السيارة جاهزة للاستلام!" },
    ],
  },
];

export const mockUsers: User[] = [
  { id: "u1", fullName: "أحمد بن سعيد الحارثي", phone: "96812345", username: "ahmed_h", role: "customer" },
  { id: "u2", fullName: "سالم بن خالد البلوشي", phone: "96887654", username: "salem_b", role: "customer" },
  { id: "u3", fullName: "محمد بن علي الريامي", phone: "96898765", username: "mohammed_r", role: "customer" },
  { id: "g1", fullName: "كراج النور المتقدم", phone: "96811111", username: "alnoor_garage", role: "garage", garageId: "g1", garageName: "كراج النور المتقدم", isPremium: true },
  { id: "g2", fullName: "كراج الصقر", phone: "96822222", username: "alsaqr_garage", role: "garage", garageId: "g2", garageName: "كراج الصقر", isPremium: false },
];

export const mockNotifications: Notification[] = [
  { id: "n1", title: "تحديث حالة السيارة", message: "سيارتك الكامري الآن قيد التصليح", timestamp: "منذ ساعة", read: false, type: "status" },
  { id: "n2", title: "صورة جديدة", message: "الكراج أرسل لك صورة محدثة", timestamp: "منذ 3 ساعات", read: false, type: "photo" },
  { id: "n3", title: "رسالة من الكراج", message: "القطعة وصلت وبنبدأ التصليح بكرة إن شاء الله", timestamp: "أمس", read: true, type: "message" },
];
