import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { mockCars, statusLabels, statusColors, CarStatus } from "@/lib/mock-data";
import { Car, Plus, Camera, Send, Clock, DollarSign, Users, Wrench, ChevronDown, Star } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const GarageDashboard = () => {
  const { user } = useAuth();
  const isPremium = user?.isPremium;
  const [selectedCar, setSelectedCar] = useState<string | null>(null);

  const garageCars = mockCars.filter((c) => c.garageId === (user?.garageId || "g1"));

  const stats = [
    { label: "السيارات الحالية", value: garageCars.length, icon: Car, color: "text-primary" },
    { label: "قيد التصليح", value: garageCars.filter((c) => c.status === "repairing").length, icon: Wrench, color: "text-neon-orange" },
    { label: "جاهزة", value: garageCars.filter((c) => c.status === "ready").length, icon: Car, color: "text-accent" },
    { label: "العملاء", value: new Set(garageCars.map((c) => c.ownerPhone)).size, icon: Users, color: "text-neon-blue" },
  ];

  return (
    <DashboardLayout title={user?.garageName || "لوحة تحكم الكراج"}>
      <div className="space-y-6">
        {/* Premium Badge */}
        {isPremium && (
          <div className="flex items-center gap-2 bg-neon-orange/10 border border-neon-orange/30 rounded-xl px-4 py-2.5">
            <Star className="w-5 h-5 text-neon-orange" />
            <span className="text-neon-orange font-bold text-sm">كراج بريميوم – ميزات متقدمة مفعلة</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass rounded-xl p-4">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Add Car Button */}
        <button className="w-full glass rounded-xl p-4 flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all text-primary font-bold">
          <Plus className="w-5 h-5" />
          إضافة سيارة جديدة
        </button>

        {/* Cars List */}
        <div className="space-y-4">
          <h3 className="text-foreground font-bold text-lg">السيارات في الكراج</h3>
          {garageCars.map((car) => (
            <div
              key={car.id}
              className={`glass rounded-xl overflow-hidden transition-all ${selectedCar === car.id ? "ring-1 ring-primary/50 neon-glow" : ""}`}
            >
              {/* Car Header */}
              <button
                onClick={() => setSelectedCar(selectedCar === car.id ? null : car.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-2/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-bold">{car.make} {car.model}</p>
                    <p className="text-xs text-muted-foreground">{car.ownerName} • {car.plateNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[car.status]}`}>
                    {statusLabels[car.status]}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${selectedCar === car.id ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Expanded Details */}
              {selectedCar === car.id && (
                <div className="border-t border-border p-4 space-y-4 animate-slide-up">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface-2 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">التكلفة</p>
                      <p className="text-foreground font-bold flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-primary" /> {car.estimatedCost} ر.ع
                      </p>
                    </div>
                    <div className="bg-surface-2 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">الوقت المتوقع</p>
                      <p className="text-foreground font-bold flex items-center gap-1">
                        <Clock className="w-4 h-4 text-neon-orange" /> {car.estimatedTime}
                      </p>
                    </div>
                  </div>

                  {/* Status Update Buttons */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">تحديث الحالة:</p>
                    <div className="flex flex-wrap gap-2">
                      {(["received", "inspecting", "repairing", "waiting_parts", "ready"] as CarStatus[]).map((status) => (
                        <button
                          key={status}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            car.status === status ? statusColors[status] + " neon-glow" : "border-border text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          {statusLabels[status]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors">
                      <Camera className="w-4 h-4" /> رفع صورة
                    </button>
                    <button className="flex-1 py-2.5 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent/20 transition-colors">
                      <Send className="w-4 h-4" /> إرسال رسالة
                    </button>
                  </div>

                  {/* Notes */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ملاحظات:</p>
                    <p className="text-sm text-foreground bg-surface-2 rounded-lg p-3">{car.notes}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GarageDashboard;
