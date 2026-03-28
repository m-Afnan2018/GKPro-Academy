# GKPro Academy — Project Documentation

## Overview

GKPro Academy is a full-stack Learning Management System (LMS) for a CA coaching institute. It has three portals:

- **Public website** — courses, blogs, contact form, about, enrollment
- **Admin panel** — content management, user management, CRM
- **Student portal** — dashboard, enrolled courses, learning resources

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), CSS Modules |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (localStorage) |
| Deployment | Docker Compose |

---

## Running the Project

### Prerequisites
- Docker + Docker Compose installed

### Start (production mode)
```bash
cd /home/ubuntu/web-apps/gkpro
docker-compose up -d
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

### Stop
```bash
docker-compose down
```

### Rebuild after code changes
```bash
docker-compose down && docker-compose up -d --build
```

### View logs
```bash
docker-compose logs -f server   # backend logs
docker-compose logs -f client   # frontend logs
```

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@gkpro.in | Admin@123 |
| Student (test) | student@test.com | Student@123 |

### Create admin (if not seeded)
```bash
docker exec -e MONGODB_URI=mongodb://mongo:27017/gkpro gkpro_server node seed-admin.js
```

---

## Project Structure

```
gkpro/
├── client/                    # Next.js frontend
│   └── src/
│       ├── app/               # App Router pages
│       │   ├── page.tsx       # Homepage
│       │   ├── about/         # About page
│       │   ├── blogs/         # Blog listing + post detail
│       │   ├── contact/       # Contact Us page
│       │   ├── courses/       # Course listing + detail [slug]
│       │   ├── admin/         # Admin panel (22 pages)
│       │   └── student/       # Student portal
│       ├── components/        # Shared UI components
│       │   ├── AnnouncementBar/  ← fetches from /api/announcements
│       │   ├── Courses/          ← fetches from /api/courses (published)
│       │   ├── Categories/       ← fetches from /api/categories
│       │   ├── Testimonials/     ← fetches from /api/testimonials (approved)
│       │   ├── Blog/             ← fetches from /api/blogs (published)
│       │   ├── Navbar/
│       │   ├── Footer/
│       │   ├── admin/            # Admin-specific components
│       │   └── student/          # Student-specific components
│       └── lib/
│           └── api.ts         # API client (all endpoints)
│
├── server/                    # Express.js backend
│   └── src/
│       ├── controllers/       # Route handlers
│       ├── models/            # Mongoose schemas
│       ├── routes/            # Express routers
│       ├── middleware/
│       │   ├── auth.js        # JWT verify (protect)
│       │   ├── roles.js       # requireRole("admin","manager")
│       │   └── approvalGuard.js  # Sets req.isDraft for managers
│       ├── services/
│       │   └── approval.service.js  # ContentApproval workflow
│       └── utils/
│           ├── ApiError.js
│           ├── ApiResponse.js
│           └── asyncHandler.js
│
└── docker-compose.yml
```

---

## Admin Panel

Access: http://localhost:3000/admin/login

### What admins can manage

| Page | URL | Description |
|---|---|---|
| Dashboard | /admin/dashboard | Stats overview |
| Users | /admin/users | Student/manager accounts |
| Approvals | /admin/approvals | Approve/reject manager content |
| Categories | /admin/categories | Course categories |
| Subcategories | /admin/subcategories | Course subcategories |
| Courses | /admin/courses | Create/edit/publish courses |
| Course Materials | /admin/courses/[id]/materials | Upload resources |
| Plans | /admin/plans | Pricing plans per course |
| Batches | /admin/batches | Batch scheduling (Online/Recorded/1-on-1) |
| Enrollments | /admin/enrollments | Student enrollment records |
| Payments | /admin/payments | Payment records |
| Leads | /admin/leads | CRM: contact form submissions + leads |
| Demo Bookings | /admin/demo-bookings | Free demo session requests |
| Announcements | /admin/announcements | Top bar announcements |
| Banners | /admin/banners | Homepage banners |
| Testimonials | /admin/testimonials | Student reviews |
| Blogs | /admin/blogs | Blog posts |
| FAQs | /admin/faqs | Course FAQs |

### Content Approval Workflow

- **Admin** → creates content → automatically `approved`
- **Manager** → creates content → goes to `pending` → admin must approve at `/admin/approvals`
- Public homepage components only show `approvalStatus: "approved"` content

---

## Frontend ↔ Backend Data Flow

### Homepage dynamic sections (all auto-update when admin adds content)

| Component | API Endpoint | Filter |
|---|---|---|
| AnnouncementBar | `GET /api/announcements?limit=1` | isActive + approved |
| Categories | `GET /api/categories?limit=8` | all public |
| Courses (6 cards) | `GET /api/courses?status=published&limit=6` | published only |
| Testimonials | `GET /api/testimonials?limit=10` | isActive + approved |
| Blog (3 posts) | `GET /api/blogs?limit=3` | isPublished + approved |

### Course Detail Page `/courses/[slug]`
- Fetches course by slug + its batches + plans
- Authenticated students can enroll
- Shows FAQs linked to the course (`/api/faqs?courseId=...`)

### Blog Pages `/blogs` and `/blogs/[slug]`
- Blog listing with search, category filter, pagination
- Full post via `/api/blogs/:slug`

### Contact Form `/contact`
- Submits to `POST /api/leads/contact` (public endpoint)
- Creates a lead in admin CRM panel

### Student Portal `/student/*`
- `StudentGuard` checks `gkpro_student_token` in localStorage
- Dashboard shows active enrollments
- `/student/courses` lists enrolled courses with "Continue Learning" links
- `/student/courses/[id]` shows course resources (only if enrolled and active)

### Admin Panel `/admin/*`
- `AdminGuard` checks `gkpro_admin_token` in localStorage
- All mutations require `Bearer <token>` header
- Role-based access: admin > manager > student

---

## API Endpoints Summary

### Public (no auth required)
```
GET  /api/health
GET  /api/courses?status=published
GET  /api/courses/:slug
GET  /api/batches
GET  /api/batches/:id
GET  /api/plans
GET  /api/categories
GET  /api/subcategories
GET  /api/announcements
GET  /api/testimonials
GET  /api/blogs
GET  /api/blogs/:slug
GET  /api/faqs
POST /api/leads/contact
POST /api/auth/login
POST /api/auth/register
```

### Student (requires student JWT)
```
GET  /api/auth/me
GET  /api/enrollments/my
GET  /api/resources?courseId=...
POST /api/enrollments (create enrollment)
POST /api/demo-bookings
```

### Admin/Manager (requires admin/manager JWT)
```
GET/POST/PATCH/DELETE /api/users
GET/POST/PATCH/DELETE /api/courses
GET/POST/PATCH/DELETE /api/batches
GET/POST/PATCH/DELETE /api/plans
GET/POST/PATCH/DELETE /api/enrollments
GET/POST/PATCH/DELETE /api/announcements
GET/POST/PATCH/DELETE /api/testimonials
GET/POST/PATCH/DELETE /api/blogs
GET/POST/PATCH/DELETE /api/faqs
GET/POST/PATCH/DELETE /api/leads
GET/POST/PATCH/DELETE /api/payments
GET/PATCH             /api/approvals
```

---

## Models Reference

| Model | Key Fields |
|---|---|
| User | name, email, passwordHash, role (admin/manager/student), isApproved |
| Course | title, slug, shortDescription, thumbnailUrl, categoryId, status (draft/published/archived) |
| Batch | courseId, title, mode (online/recorded/one_on_one), startDate, endDate, maxStudents |
| CoursePlan | courseId, batchId, name, price, features[] |
| Enrollment | studentId, batchId, planId, status (active/expired/cancelled), paymentStatus |
| Announcement | title, content, type, isActive, approvalStatus |
| Testimonial | studentName, courseName, content, rating, photoUrl, isActive, approvalStatus |
| Blog | title, slug (auto-gen), content, imageUrl, authorId, isPublished, approvalStatus |
| Faq | courseId (optional), question, answer, sortOrder, isActive |
| Lead | name, email, phone, notes, source, status (new/contacted/converted) |

---

## How to Add Content (Admin Guide)

### Add a new course
1. Go to Admin → Categories → create category if needed
2. Go to Admin → Courses → "+ New Course" → fill title, description, thumbnail URL → publish
3. Go to Admin → Batches → "+ New Batch" → link to course, set mode (Online/Recorded/1-on-1)
4. Go to Admin → Plans → "+ New Plan" → link to batch, set price
5. Course now appears on `/courses` and homepage

### Add a blog post
1. Go to Admin → Blogs → "+ New Post"
2. Fill title (slug auto-generated), content (HTML supported), cover image URL
3. Set Published = Yes
4. Post appears on `/blogs` and homepage blog section

### Add a testimonial
1. Go to Admin → Testimonials → "+ New Testimonial"
2. Fill student name, course name, review text, rating
3. Submit → automatically approved (admin) or pending (manager)
4. Approved testimonials appear on homepage

### Add an announcement
1. Go to Admin → Announcements → "+ New Announcement"
2. Fill content text, select type (discount/general/etc.), set Active = Yes
3. Appears in the red announcement bar at top of homepage

---

## Environment Variables

### Server
```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb://mongo:27017/gkpro
JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=         # optional
RAZORPAY_KEY_SECRET=     # optional
CLIENT_URL=http://localhost:3000
```

### Client (build-time)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
> Note: This is baked in at Docker build time. Change via `docker-compose.yml` `args` section.

---

## Deployment Notes

- The frontend is a Next.js standalone build (`output: 'standalone'`) packaged in Docker
- Static assets are copied to `.next/static` and served by Next.js
- MongoDB data is persisted in a Docker volume (`mongo_data`)
- To expose to the internet, update `NEXT_PUBLIC_API_URL` to your server's public IP/domain and rebuild

---

## Common Troubleshooting

| Problem | Solution |
|---|---|
| "Invalid email or password" | Run seed script: `docker exec gkpro_server node seed-admin.js` |
| Frontend not showing new content | Rebuild: `docker-compose down && docker-compose up -d --build` |
| Cannot enroll (no plans showing) | Add a Batch + Plan for the course in admin panel |
| Blog slug not generating | Slug is auto-generated from title on save (server-side) |
| Manager content not appearing | Admin must approve it at `/admin/approvals` |
