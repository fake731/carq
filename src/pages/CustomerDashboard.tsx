import DashboardLayout from "@/components/DashboardLayout";
import { mockCars, mockNotifications, statusLabels, statusColors, CarStatus } from "@/lib/mock-data";
import { Car, Clock, DollarSign, MessageSquare, Image, CheckCircle2, AlertCircle, Wrench, Package, Eye } from "lucide-react";

const statusIcons: Record<CarStatus, typeof Car> = {
  received: CheckCircle2,
  inspecting: Eye,
  repairing: Wrench,
  waiting_parts: Package,
  ready: CheckCircle2,
};

const CustomerDashboard = () => {
  const car = mockCars[0]; // Mock: first car belongs to logged-in user

  const statusSteps: CarStatus[] = ["received", "inspecting", "repairing", "waiting_parts", "ready"];
  const currentStepIndex = statusSteps.indexOf(car.status);

  return (
    <DashboardLayout title="لوحة التحكم">
      <div className="space-y-6">
        {/* Car Status Card */}
        <div className="glass rounded-2xl p-6 neon-glow">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">{car.make} {car.model} {car.year}</h2>
              <p className="text-muted-foreground text-sm mt-1">رقم اللوحة: {car.plateNumber}</p>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${statusColors[car.status]}`}>
              {statusLabels[car.status]}
            </span>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-1 mb-6">
            {statusSteps.map((step, i) => {
              const Icon = statusIcons[step];
              const isActive = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step} className="flex-1 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCurrent ? "border-primary bg-primary/20 neon-glow" :
                    isActive ? "border-accent bg-accent/10" : "border-border bg-surface-2"
                  }`}>
                    <Icon className={`w-5 h-5 ${isCurrent ? "text-primary" : isActive ? "text-accent" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-[10px] mt-1.5 text-center ${isCurrent ? "text-primary font-bold" : isActive ? "text-accent" : "text-muted-foreground"}`}>
                    {statusLabels[step]}
                  </span>
                  {i < statusSteps.length - 1 && (
                    <div className={`absolute h-0.5 ${isActive ? "bg-accent" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: DollarSign, label: "التكلفة المتوقعة", value: `${car.estimatedCost} ر.ع`, color: "text-primary" },
            { icon: Clock, label: "الوقت المتوقع", value: car.estimatedTime, color: "text-neon-orange" },
            { icon: Wrench, label: "الكراج", value: "كراج النور المتقدم", color: "text-accent" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass rounded-xl p-4">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-foreground font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-foreground font-bold mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            ملاحظات
          </h3>
          <p className="text-muted-foreground text-sm">{car.notes}</p>
        </div>

        {/* Timeline */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-foreground font-bold mb-4">سجل التحديثات</h3>
          <div className="space-y-4">
            {car.updates.map((update, i) => (
              <div key={update.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${i === car.updates.length - 1 ? "bg-primary animate-pulse-neon" : "bg-accent"}`} />
                  {i < car.updates.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-bold text-foreground">{update.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{update.timestamp}</p>
                  <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border ${statusColors[update.status]}`}>
                    {statusLabels[update.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-foreground font-bold mb-4">الإشعارات</h3>
          <div className="space-y-3">
            {mockNotifications.map((notif) => (
              <div key={notif.id} className={`flex items-start gap-3 p-3 rounded-lg ${notif.read ? "bg-surface-2" : "bg-primary/5 border border-primary/20"}`}>
                <div className={`w-2 h-2 rounded-full mt-2 ${notif.read ? "bg-muted-foreground" : "bg-primary animate-pulse-neon"}`} />
                <div>
                  <p className="text-sm font-bold text-foreground">{notif.title}</p>
                  <p className="text-xs text-muted-foreground">{notif.message}</p>
                  <span className="text-[10px] text-muted-foreground">{notif.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
