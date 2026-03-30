// Real permissions system
export const ALL_PERMISSIONS = [
  "add_car",
  "edit_car",
  "delete_car",
  "view_cars",
  "approve_requests",
  "reject_requests",
  "manage_requests",
  "send_message",
  "read_messages",
  "delete_messages",
  "edit_profile",
  "upload_photos",
  "delete_photos",
  "add_rating",
  "delete_rating",
  "manage_users",
  "ban_user",
  "unban_user",
  "view_statistics",
  "export_data",
  "manage_settings",
  "access_dashboard",
  "manage_comments",
  "delete_comments",
  "pin_comments",
  "edit_themes",
  "resize_text",
  "edit_text",
  "manage_garages",
  "manage_notifications",
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  add_car: "إضافة سيارة",
  edit_car: "تعديل سيارة",
  delete_car: "حذف سيارة",
  view_cars: "عرض السيارات",
  approve_requests: "قبول الطلبات",
  reject_requests: "رفض الطلبات",
  manage_requests: "إدارة الطلبات",
  send_message: "إرسال رسالة",
  read_messages: "قراءة الرسائل",
  delete_messages: "حذف الرسائل",
  edit_profile: "تعديل الملف الشخصي",
  upload_photos: "رفع صور",
  delete_photos: "حذف صور",
  add_rating: "إضافة تقييم",
  delete_rating: "حذف تقييم",
  manage_users: "إدارة المستخدمين",
  ban_user: "حظر مستخدم",
  unban_user: "فك حظر مستخدم",
  view_statistics: "عرض الإحصائيات",
  export_data: "تصدير البيانات",
  manage_settings: "إدارة الإعدادات",
  access_dashboard: "الوصول للوحة التحكم",
  manage_comments: "إدارة التعليقات",
  delete_comments: "حذف التعليقات",
  pin_comments: "تثبيت التعليقات",
  edit_themes: "تعديل الثيمات",
  resize_text: "تكبير النص",
  edit_text: "تعديل النص",
  manage_garages: "إدارة الكراجات",
  manage_notifications: "إدارة الإشعارات",
};

// Role-based default permissions
export function getPermissionsForRole(role: string): Permission[] {
  switch (role) {
    case "admin":
      return [...ALL_PERMISSIONS]; // Admin gets everything
    case "garage":
      return [
        "add_car", "edit_car", "view_cars",
        "send_message", "read_messages",
        "edit_profile", "upload_photos",
        "access_dashboard", "manage_requests",
      ];
    case "customer":
      return [
        "view_cars", "send_message", "read_messages",
        "edit_profile", "add_rating",
      ];
    default:
      return []; // Visitor - no permissions
  }
}

export function hasPermission(userPermissions: Permission[], permission: Permission): boolean {
  return userPermissions.includes(permission);
}
