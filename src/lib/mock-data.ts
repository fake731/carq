// Status types and labels - still needed for UI
export type CarStatus = "received" | "inspecting" | "repairing" | "waiting_parts" | "ready";

export const statusLabels: Record<string, string> = {
  received: "تم الاستلام",
  inspecting: "قيد الفحص",
  repairing: "قيد التصليح",
  waiting_parts: "بانتظار قطع",
  ready: "جاهزة",
  pending: "بانتظار الموافقة",
  week_wait: "باقي أسبوع",
  two_weeks: "باقي أسبوعين",
  month_wait: "باقي شهر",
  needs_time: "تحتاج وقت",
  not_started: "لم تبدأ",
  testing: "قيد التجربة",
  delivered: "تم التسليم",
};

export const statusColors: Record<string, string> = {
  received: "status-received",
  inspecting: "status-inspecting",
  repairing: "status-repairing",
  waiting_parts: "status-waiting",
  ready: "status-ready",
  pending: "status-inspecting",
  week_wait: "status-waiting",
  two_weeks: "status-waiting",
  month_wait: "status-waiting",
  needs_time: "status-inspecting",
  not_started: "status-received",
  testing: "status-repairing",
  delivered: "status-ready",
};
