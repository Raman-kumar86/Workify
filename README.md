# Workify

Workify is a full-stack on-demand labour marketplace built with the MERN stack. It connects users who need skilled help with verified workers, supports real-time task updates, live tracking, OTP-based arrival verification, and review/report handling.

---

## Table of Contents

1. [Project Properties](#project-properties)
2. [Tech Stack](#tech-stack)
3. [Data Properties](#data-properties)
4. [API Reference](#api-reference)
5. [Environment Variables](#environment-variables)
6. [Installation and Setup](#installation-and-setup)
7. [Contributing](#contributing)

---

## Project Properties

### User Properties
- Signup, login, and password recovery.
- Browse service categories and post tasks.
- Add title, description, budget, schedule, contact details, address, map location, and images.
- Track assigned worker location in real time.
- Receive OTP when worker arrives and complete OTP verification flow.
- View own tasks with status updates.
- Submit worker reviews and reports after completion.
- Receive in-app notifications for task events.

### Worker Properties
- Register with identity details for verification.
- Toggle online and offline availability.
- Discover nearby available tasks by category and range.
- Accept tasks with first-come atomic assignment.
- Reject tasks with penalty handling.
- Send location updates and complete assigned work.
- Trigger arrival OTP flow and verify OTP to start work.
- View profile stats including completed tasks, ratings, and fines.

### Platform and Safety Properties
- Worker and user ban control using configurable durations.
- Fine tracking for task rejection and cancellation scenarios.
- Task expiry support for stale broadcasting tasks.
- Notification delivery for user and worker actions.
- GPS anomaly filtering for unrealistic movement updates.
- Route history capping to control document growth.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite |
| Styling | Tailwind CSS v4 |
| State management | Redux Toolkit + React-Redux |
| Routing | React Router DOM v7 |
| Maps | React-Leaflet v4 + Leaflet Geosearch |
| HTTP client | Axios |
| Real-time | Socket.IO Client v4 |
| Backend runtime | Node.js (ESM) |
| Backend framework | Express v5 |
| Database | MongoDB + Mongoose v8 |
| Authentication | JWT + bcryptjs |
| Media storage | Cloudinary |
| Email | Nodemailer |

---

## Data Properties

### User
| Property | Type | Notes |
|---|---|---|
| `name` | String | 2-50 chars |
| `email` | String | Unique |
| `userType` | String | `user` or `worker` |
| `password` | String | Hashed |
| `contactNumber` | String | 10-digit |
| `isVerified` | Boolean | Email verification state |
| `walletBalance` | Number | Supports penalties |
| `banExpiresAt` | Date | Ban end timestamp |

### Worker
| Property | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Reference to user |
| `adharCardNumber` | String | Verification field |
| `idCardImage` | String | Cloudinary URL |
| `status` | String | `pending`, `verified`, `rejected` |
| `services` | Array | Category and experience data |
| `isOnline` | Boolean | Availability flag |
| `currentLocation` | GeoJSON Point | Indexed for proximity |
| `workerLocation` | Object | Live coordinates |
| `routeHistory` | Array | Limited route points |
| `rating` | Number | Average rating |
| `completedTasks` | Number | Completion count |
| `banExpiresAt` | Date | Ban end timestamp |
| `outstandingFines` | Number | Unpaid penalties |

### Task
| Property | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Task creator |
| `assignedWorkerId` | ObjectId | Assigned worker |
| `title` | String | Task title |
| `description` | String | Task details |
| `taskType` | String | Category |
| `subcategory` | String | Subcategory |
| `images` | Array | Cloudinary URLs |
| `contactNumber` | String | Primary contact |
| `alternateContactNumber` | String | Optional contact |
| `address` | String | Task address |
| `location` | GeoJSON Point | Coordinates |
| `scheduledStartAt` | Date | Start time |
| `availabilityTimeSlots` | Array | Allowed time windows |
| `estimatedDurationMinutes` | Number | Estimated duration |
| `status` | String | Task state |
| `expiresAt` | Date | Expiry timestamp |
| `acceptedAt` | Date | Assigned timestamp |
| `arrivedAt` | Date | Arrival timestamp |
| `inProgressAt` | Date | Start-work timestamp |
| `completedAt` | Date | Completion timestamp |
| `otp` | String | Arrival verification code |
| `otpExpiresAt` | Date | OTP expiry |
| `otpVerifiedAt` | Date | OTP verification timestamp |
| `price` | Number | Task price |
| `currency` | String | Default INR |
| `paymentStatus` | String | Payment state |
| `workSummary` | String | Completion notes |

### Other Collections
- Notification: tracks user and worker notification records and read state.
- Review: stores rating and feedback against a task/worker.
- Report: stores issue reports raised by users.
- TaskRejection: stores worker rejection audit entries.

---

## API Reference

All routes except auth routes require a valid JWT in the `Authorization: Bearer <token>` header.

### Auth - `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/signup` | Register user |
| POST | `/login` | Authenticate user |

### User - `/api/user`
| Method | Path | Description |
|---|---|---|
| POST | `/create` | Create task |
| GET | `/my-works` | Fetch current user tasks |
| DELETE | `/delete/:id` | Delete task |
| PUT | `/task/:id/renew` | Renew task |
| POST | `/task/:taskId/review` | Submit review |
| GET | `/task/:taskId/review` | Get review |
| POST | `/task/:taskId/report` | Submit report |

### Worker - `/api/worker`
| Method | Path | Description |
|---|---|---|
| GET | `/profile` | Worker profile |
| POST | `/verify-worker` | Upload worker verification info |
| PATCH | `/availability` | Update worker availability |
| GET | `/tasks/available` | Get available nearby tasks |
| POST | `/tasks/:taskId/accept` | Accept task |
| POST | `/tasks/:taskId/reject` | Reject task |
| POST | `/tasks/:taskId/complete` | Complete task |
| POST | `/tasks/:taskId/location` | Send location update |
| POST | `/tasks/:taskId/arrived` | Mark arrived and trigger OTP |
| POST | `/tasks/:taskId/verify-otp` | Verify OTP and start task |

### Notifications - `/api/notifications`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Fetch notifications |
| PATCH | `/read-all` | Mark all as read |
| PATCH | `/:id/read` | Mark one as read |

---

## Environment Variables

### Server (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/uber-labour
JWT_SECRET=your_jwt_super_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=uber_tasks
```

---

## Installation and Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary account
- Gmail with app password (for OTP email delivery)

### 1. Clone
```bash
git clone https://github.com/Raman-kumar86/Workify.git
cd uber-labour
```

### 2. Backend
```bash
cd server
npm install
npm run dev
```

### 3. Frontend
```bash
cd client
npm install
npm run dev
```

Run backend and frontend together for full functionality.

---

## Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature`.
3. Commit changes: `git commit -m "feat: add your change"`.
4. Push and open a pull request.
