// Status types and labels - still needed for UI
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
