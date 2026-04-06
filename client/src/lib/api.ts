const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

/* ── helpers ─────────────────────────────────────── */

function token(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("gkpro_admin_token") ||
    localStorage.getItem("gkpro_student_token")
  );
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const tk = token();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(tk ? { Authorization: `Bearer ${tk}` } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.message ?? `Request failed: ${res.status}`);
  }
  return json as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
const del = <T>(path: string) =>
  request<T>(path, { method: "DELETE" });

/* ── auth ────────────────────────────────────────── */

export const authApi = {
  login: (email: string, password: string) =>
    post<{ data: { token: string; user: User } }>("/auth/login", { email, password }),
  register: (name: string, email: string, phone: string, password: string) =>
    post<{ data: { token: string; user: User } }>("/auth/register", { name, email, phone, password }),
  me: () => get<{ data: User }>("/auth/me"),
  updateMe: (body: Partial<User & { password?: string }>) =>
    patch<{ data: User }>("/auth/me", body),
};

/* ── users ───────────────────────────────────────── */

export const usersApi = {
  list: (page = 1, limit = 10, role?: string) =>
    get<{ data: { users: User[]; total: number } }>(`/users?page=${page}&limit=${limit}${role ? `&role=${role}` : ""}`),
  create: (body: { name: string; email: string; phone?: string; password: string; role: string; isActive?: boolean }) =>
    post<{ data: User }>("/users", body),
  update: (id: string, body: Partial<User> & { password?: string }) =>
    patch<{ data: User }>(`/users/${id}`, body),
  remove: (id: string) => del(`/users/${id}`),
};

/* ── categories ──────────────────────────────────── */

export const categoriesApi = {
  list: (page = 1, limit = 20) =>
    get<{ data: { categories: Category[]; total: number } }>(`/categories?page=${page}&limit=${limit}`),
  create: (body: Partial<Category>) =>
    post<{ data: Category }>("/categories", body),
  update: (id: string, body: Partial<Category>) =>
    patch<{ data: Category }>(`/categories/${id}`, body),
  remove: (id: string) => del(`/categories/${id}`),
};

/* ── subcategories ───────────────────────────────── */

export const subcategoriesApi = {
  list: (page = 1, limit = 50, categoryId?: string) =>
    get<{ data: { subcategories: SubCategory[]; total: number } }>(
      `/subcategories?page=${page}&limit=${limit}${categoryId ? `&categoryId=${categoryId}` : ""}`
    ),
  create: (body: Partial<SubCategory>) =>
    post<{ data: SubCategory }>("/subcategories", body),
  update: (id: string, body: Partial<SubCategory>) =>
    patch<{ data: SubCategory }>(`/subcategories/${id}`, body),
  remove: (id: string) => del(`/subcategories/${id}`),
};

/* ── courses ─────────────────────────────────────── */

export const coursesApi = {
  list: (page = 1, limit = 10) =>
    get<{ data: { courses: Course[]; total: number } }>(
      `/courses/admin/all?page=${page}&limit=${limit}`
    ),
  create: (body: Partial<Course>) =>
    post<{ data: Course }>("/courses", body),
  update: (id: string, body: Partial<Course>) =>
    patch<{ data: Course }>(`/courses/${id}`, body),
  remove: (id: string) => del(`/courses/${id}`),
  categories: () =>
    get<{ data: { categories: Category[] } }>("/categories?limit=100"),
  subcategories: (categoryId?: string) =>
    get<{ data: { subcategories: SubCategory[] } }>(
      `/subcategories?limit=200${categoryId ? `&categoryId=${categoryId}` : ""}`
    ),
};

/* ── faculty ─────────────────────────────────────── */

export const facultyApi = {
  list: (page = 1, limit = 100) =>
    get<{ data: { faculty: Faculty[]; total: number } }>(`/faculty?page=${page}&limit=${limit}`),
  create: (body: Partial<Faculty>) =>
    post<{ data: Faculty }>("/faculty", body),
  update: (id: string, body: Partial<Faculty>) =>
    patch<{ data: Faculty }>(`/faculty/${id}`, body),
  remove: (id: string) => del(`/faculty/${id}`),
};

/* ── media ───────────────────────────────────────── */

export interface MediaFile {
  filename: string;
  url: string;
  ext: string;
  type: "image" | "video" | "pdf" | "document" | "other";
  size: number;
  sizeFormatted: string;
  createdAt: string;
  mtime: string;
}

export const mediaApi = {
  list: (page = 1, limit = 50, type = "all", search = "") =>
    get<{ data: { files: MediaFile[]; total: number } }>(
      `/media?page=${page}&limit=${limit}&type=${type}&search=${encodeURIComponent(search)}`
    ),
  remove: (filename: string) => del(`/media/${encodeURIComponent(filename)}`),
};

/* ── enrollments ─────────────────────────────────── */

export const enrollmentsApi = {
  list: (page = 1, limit = 10) =>
    get<{ data: { enrollments: Enrollment[]; total: number } }>(`/enrollments?page=${page}&limit=${limit}`),
  create: (courseId: string, mode: "online" | "recorded", bookType?: string, deliveryAddress?: string) =>
    post<{ data: Enrollment }>("/enrollments", { courseId, mode, bookType, deliveryAddress }),
  update: (id: string, body: Partial<Enrollment>) =>
    patch<{ data: Enrollment }>(`/enrollments/${id}`, body),
  cancel: (id: string) =>
    patch<{ data: Enrollment }>(`/enrollments/${id}/cancel`, {}),
};

/* ── payments ────────────────────────────────────── */

export const paymentsApi = {
  list: (page = 1, limit = 10) =>
    get<{ data: { payments: Payment[]; total: number } }>(`/payments?page=${page}&limit=${limit}`),
  createOrder: (courseId: string, mode: "online" | "recorded", bookType?: string, deliveryAddress?: string) =>
    post<{ data: { orderId: string; amount: number; currency: string; key: string; paymentId: string } }>(
      "/payments/razorpay/create-order", { courseId, mode, bookType, deliveryAddress }
    ),
  verifyPayment: (body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; courseId: string; mode: string; bookType?: string; deliveryAddress?: string }) =>
    post<{ data: { payment: Payment; enrollment: any } }>("/payments/razorpay/verify", body),
};

/* ── leads ───────────────────────────────────────── */

export const leadsApi = {
  list: (page = 1, limit = 10) =>
    get<{ data: { leads: Lead[]; total: number } }>(`/leads?page=${page}&limit=${limit}`),
  create: (body: Partial<Lead>) =>
    post<{ data: Lead }>("/leads", body),
  update: (id: string, body: Partial<Lead>) =>
    patch<{ data: Lead }>(`/leads/${id}`, body),
  remove: (id: string) => del(`/leads/${id}`),
  convert: (id: string) =>
    post<{ data: Lead }>(`/leads/${id}/convert`, {}),
};

/* ── demo bookings ───────────────────────────────── */

export const demoBookingsApi = {
  list: (page = 1, limit = 10) =>
    get<{ data: { bookings: DemoBooking[]; total: number } }>(`/demo-bookings?page=${page}&limit=${limit}`),
  update: (id: string, body: Partial<DemoBooking>) =>
    patch<{ data: DemoBooking }>(`/demo-bookings/${id}`, body),
  remove: (id: string) => del(`/demo-bookings/${id}`),
};

/* ── announcements ───────────────────────────────── */

export const announcementsApi = {
  list: (page = 1, limit = 10) =>
    get<{ data: { announcements: Announcement[]; total: number } }>(`/announcements?page=${page}&limit=${limit}`),
  create: (body: Partial<Announcement>) =>
    post<{ data: Announcement }>("/announcements", body),
  update: (id: string, body: Partial<Announcement>) =>
    patch<{ data: Announcement }>(`/announcements/${id}`, body),
  remove: (id: string) => del(`/announcements/${id}`),
};

/* ── banners ─────────────────────────────────────── */

export const bannersApi = {
  list: (page = 1, limit = 10) =>
    get<{ data: { banners: Banner[]; total: number } }>(`/banners?page=${page}&limit=${limit}`),
  create: (body: Partial<Banner>) =>
    post<{ data: Banner }>("/banners", body),
  update: (id: string, body: Partial<Banner>) =>
    patch<{ data: Banner }>(`/banners/${id}`, body),
  remove: (id: string) => del(`/banners/${id}`),
};

/* ── testimonials ────────────────────────────────── */

export const testimonialsApi = {
  list: (page = 1, limit = 10) =>
    get<{ data: { testimonials: Testimonial[]; total: number } }>(`/testimonials?page=${page}&limit=${limit}`),
  create: (body: Partial<Testimonial>) =>
    post<{ data: Testimonial }>("/testimonials", body),
  update: (id: string, body: Partial<Testimonial>) =>
    patch<{ data: Testimonial }>(`/testimonials/${id}`, body),
  remove: (id: string) => del(`/testimonials/${id}`),
};

/* ── blogs ───────────────────────────────────────── */

export const blogsApi = {
  list: (page = 1, limit = 10) =>
    get<{ data: { blogs: Blog[]; total: number } }>(`/blogs?page=${page}&limit=${limit}`),
  create: (body: Partial<Blog>) =>
    post<{ data: Blog }>("/blogs", body),
  update: (id: string, body: Partial<Blog>) =>
    patch<{ data: Blog }>(`/blogs/${id}`, body),
  remove: (id: string) => del(`/blogs/${id}`),
};

/* ── faqs ────────────────────────────────────────── */

export const faqsApi = {
  list: (page = 1, limit = 20) =>
    get<{ data: { faqs: Faq[]; total: number } }>(`/faqs?page=${page}&limit=${limit}`),
  create: (body: Partial<Faq>) =>
    post<{ data: Faq }>("/faqs", body),
  update: (id: string, body: Partial<Faq>) =>
    patch<{ data: Faq }>(`/faqs/${id}`, body),
  remove: (id: string) => del(`/faqs/${id}`),
};

/* ── resources ───────────────────────────────────── */

export const resourcesApi = {
  list: (courseId?: string, page = 1, limit = 100) =>
    get<{ data: { resources: Resource[]; total: number } }>(
      `/resources?page=${page}&limit=${limit}${courseId ? `&courseId=${courseId}` : ""}`
    ),
  create: (body: Partial<Resource>) =>
    post<{ data: Resource }>("/resources", body),
  update: (id: string, body: Partial<Resource>) =>
    patch<{ data: Resource }>(`/resources/${id}`, body),
  remove: (id: string) => del(`/resources/${id}`),
  reorder: (items: { _id: string; sortOrder: number }[]) =>
    patch<{ data: null }>("/resources/reorder", { items }),
  access: (id: string) =>
    post<{ data: { url: string; type: string } }>(`/resources/${id}/access`, {}),
};

/* ── approvals ───────────────────────────────────── */

export const approvalsApi = {
  pending: (page = 1, limit = 10) =>
    get<{ data: { approvals: Approval[]; total: number } }>(
      `/approvals/pending?page=${page}&limit=${limit}`
    ),
  approve: (id: string) =>
    post<{ data: Approval }>(`/approvals/${id}/approve`, {}),
  reject: (id: string, reviewNotes: string) =>
    post<{ data: Approval }>(`/approvals/${id}/reject`, { reviewNotes }),
};

/* ── dashboard stats ─────────────────────────────── */

export const dashboardApi = {
  stats: () =>
    Promise.all([
      get<{ data: { total: number } }>("/users?limit=1").catch(() => ({ data: { total: 0 } })),
      get<{ data: { total: number } }>("/courses/admin/all?limit=1").catch(() => ({ data: { total: 0 } })),
      get<{ data: { total: number } }>("/enrollments?limit=1").catch(() => ({ data: { total: 0 } })),
      get<{ data: { total: number } }>("/approvals/pending?limit=1").catch(() => ({ data: { total: 0 } })),
      get<{ data: { payments: Payment[]; total: number } }>("/payments?limit=5").catch(() => ({ data: { payments: [], total: 0 } })),
    ]).then(([users, courses, enrollments, approvals, payments]) => ({
      totalUsers: (users as any).data?.total ?? 0,
      totalCourses: (courses as any).data?.total ?? 0,
      totalEnrollments: (enrollments as any).data?.total ?? 0,
      pendingApprovals: (approvals as any).data?.total ?? 0,
      recentPayments: (payments as any).data?.payments ?? [],
    })),
};

/* ── types ───────────────────────────────────────── */

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "student" | "manager" | "admin";
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isComingSoon: boolean;
  sortOrder: number;
}

export interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  categoryId: Category | string;
  imageUrl?: string;
  isComingSoon: boolean;
  sortOrder: number;
}

export interface Faculty {
  _id: string;
  name: string;
  designation?: string | null;
  bio?: string | null;
  avatar?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  categoryId: Category | string;
  subcategoryId?: SubCategory | string | null;
  description?: string;
  overview?: string;
  whoIsItFor?: string[];
  technicalRequirements?: string[];
  thumbnailUrl?: string;
  onlinePrice?: number | null;
  onlineOriginalPrice?: number | null;
  recordedPrice?: number | null;
  recordedOriginalPrice?: number | null;
  bookEnabled?: boolean;
  eBookPrice?: number | null;
  eBookUrl?: string | null;
  handbookPrice?: number | null;
  handbookUrl?: string | null;
  // Curriculum metadata
  numLectures?: string | null;
  duration?: string | null;
  language?: string | null;
  validity?: string | null;
  studyMaterial?: string | null;
  startDate?: string | null;
  validityMonths?: number | null;
  targetAudience?: string | null;
  isNew?: boolean;
  highlights?: string[];
  prerequisites?: string[];
  // Faculty (multiple)
  faculty?: Faculty[];
  availableModes?: "both" | "online" | "recorded";
  status: "draft" | "published" | "archived";
  approvalStatus: "draft" | "pending" | "approved" | "rejected";
  createdBy?: Partial<User>;
  createdAt: string;
}

export interface Enrollment {
  _id: string;
  studentId: Partial<User> | string;
  courseId: Partial<Course> | string;
  mode: "online" | "recorded";
  pricePaid?: number;
  bookType?: "none" | "ebook" | "handbook";
  deliveryAddress?: string | null;
  bookPricePaid?: number;
  enrolledAt: string;
  expiresAt?: string;
  status: "active" | "expired" | "cancelled";
  paymentId?: Partial<Payment> | string;
}

export interface Lead {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  courseId?: Partial<Course> | string;
  source: "website" | "whatsapp" | "demo" | "referral" | "other";
  status: "new" | "contacted" | "converted";
  notes?: string;
  assignedTo?: Partial<User> | string;
  createdAt: string;
}

export interface DemoBooking {
  _id: string;
  name: string;
  phone: string;
  courseId?: Partial<Course> | string;
  slotTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  handledBy?: Partial<User> | string;
  createdAt: string;
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: "discount" | "upcoming_batch" | "ongoing_batch" | "general";
  validUntil?: string;
  isActive: boolean;
  approvalStatus: "draft" | "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface Banner {
  _id: string;
  imageUrl: string;
  linkUrl?: string;
  altText?: string;
  sortOrder: number;
  isActive: boolean;
  approvalStatus: "draft" | "pending" | "approved" | "rejected";
}

export interface Testimonial {
  _id: string;
  studentName: string;
  courseId?: Course | string | null;
  courseName?: string;
  content: string;
  rating: number;
  photoUrl?: string;
  isActive: boolean;
  isGeneral: boolean;
  approvalStatus: "draft" | "pending" | "approved" | "rejected";
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  authorId: Partial<User> | string;
  isPublished: boolean;
  approvalStatus: "draft" | "pending" | "approved" | "rejected";
  publishedAt?: string;
  createdAt: string;
  imageUrl?: string;
}

export interface Faq {
  _id: string;
  courseId?: Partial<Course> | string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Approval {
  _id: string;
  entityType: string;
  entityId: string;
  submittedBy: Partial<User>;
  reviewedBy?: Partial<User>;
  status: "pending" | "approved" | "rejected";
  reviewNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface Payment {
  _id: string;
  orderId?: string;
  studentId: Partial<User>;
  enrollmentId?: string;
  amount: number;
  currency: string;
  method: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: string;
  isManual?: boolean;
  paidAt?: string;
  createdAt: string;
}

export interface Resource {
  _id: string;
  courseId?: Course | string | null;
  title: string;
  description?: string;
  type: "video" | "pdf" | "link" | "doc" | "meet";
  url: string;
  section: string;
  sortOrder: number;
  duration?: string;
  isPublic: boolean;
  approvalStatus: "draft" | "pending" | "approved" | "rejected";
}
