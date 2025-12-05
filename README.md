# Course Master - Learning Management System API

A comprehensive backend API for a Learning Management System (LMS) built with Express.js and MongoDB. The system enables course management, student enrollment, quiz submissions, assignments, and progress tracking.

## Table of Contents

- [Project Overview](#project-overview)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)

---

## Project Overview

**Course Master** is a modern LMS backend that provides:
- **Course Management**: Create, update, and manage courses with modules and lessons
- **Student Enrollment**: Handle course enrollments and batch management
- **Quiz System**: Create quizzes with multiple-choice and true-false questions with auto-grading
- **Assignment System**: Submit assignments with manual grading by instructors
- **Progress Tracking**: Track student progress, completion rates, and course statistics
- **Authentication**: Secure JWT-based authentication with role-based access control

---

## Installation

### Prerequisites

- **Node.js** v18+ or **Bun** (recommended)
- **MongoDB** database instance
- **bun** or **pnpm** package manager

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/eloraa/course-master-server
   cd course-master-server
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or with bun
   bun install
   ```

3. **Create `.env` file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** (see [Environment Variables](#environment-variables))

---

## Running the Application

### Development Mode

```bash
pnpm run dev
# or with bun
bun --hot run index.ts
```

The server will start on `http://localhost:8080` (or port specified in `.env`)

### Production Build

```bash
npm run build
npm start
```

---

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

### Required Variables

```env
# Node Environment
NODE_ENV=development                    # development | production | test

# Server Configuration
PORT=8080                               # Server port

# Database
MONGO_URI=mongodb+srv://...            # MongoDB connection string
MONGO_URI_TESTS=mongodb+srv://...      # MongoDB test database URL (optional)

# Authentication
JWT_SECRET=your_jwt_secret_key         # Secret key for JWT token signing
JWT_EXPIRATION_MINUTES=15000           # JWT token expiration time in minutes

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com  # Comma-separated list of allowed origins
```

### Optional Variables

```env
# Logging (automatically set based on NODE_ENV)
# LOG_LEVEL=debug | info | warn | error
```

### Example `.env` File

```env
NODE_ENV=development
PORT=8080
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRATION_MINUTES=15000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/coursemaster?appName=MainCluster
CORS_ORIGINS=http://localhost:3000,https://course-master-frontend-sigma.vercel.app
```

---

## API Documentation

### Base URL

```
http://localhost:8080/v1
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

### Public Routes

#### Authentication

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Register new user account |
| POST | `/auth/login` | Login and get JWT token |
| POST | `/auth/refresh-token` | Refresh JWT token |

#### Public Courses

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/courses` | List public courses |
| GET | `/courses/:id` | Get course details |

---

### Student Routes (Authenticated)

#### My Dashboard

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/me/dashboard` | Get student dashboard summary |
| GET | `/me/progress` | Get student progress across courses |

#### Courses

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/me/courses` | List enrolled courses |
| GET | `/me/courses/:courseId` | Get enrolled course details |

#### Content (Modules & Lessons)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/me/courses/:courseId/modules` | Get course modules |
| GET | `/me/courses/:courseId/modules/:moduleId/lessons` | Get module lessons |
| GET | `/me/courses/:courseId/lessons/:lessonId` | Get lesson details |
| POST | `/me/courses/:courseId/lessons/:lessonId/complete` | Mark lesson as complete |

#### Quizzes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/me/quizzes` | List all quiz submissions |
| GET | `/me/courses/:courseId/quizzes/:quizId` | Get quiz (with submission status if taken) |
| POST | `/me/courses/:courseId/quizzes/:quizId/submit` | Submit quiz answers |
| GET | `/me/courses/:courseId/quizzes/:quizId/results` | Get quiz results |

#### Assignments

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/me/assignments` | List all assignments |
| GET | `/me/courses/:courseId/assignments/:assignmentId` | Get assignment details |
| POST | `/me/courses/:courseId/assignments/:assignmentId/submit` | Submit assignment |
| GET | `/me/courses/:courseId/assignments/:assignmentId/submission` | Get submission status |

---

### Admin Routes (Admin Only)

#### Courses

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/admin/courses` | Create new course |
| GET | `/admin/courses` | List all courses |
| GET | `/admin/courses/:id` | Get course details |
| PUT | `/admin/courses/:id` | Update course |
| DELETE | `/admin/courses/:id` | Delete course |
| PATCH | `/admin/courses/:id/publish` | Publish course |

#### Modules

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/admin/modules` | Create module |
| GET | `/admin/modules` | List modules |
| GET | `/admin/modules/:id` | Get module details |
| PUT | `/admin/modules/:id` | Update module |
| DELETE | `/admin/modules/:id` | Delete module |

#### Lessons

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/admin/lessons` | Create lesson |
| GET | `/admin/lessons` | List lessons |
| GET | `/admin/lessons/:id` | Get lesson details |
| PUT | `/admin/lessons/:id` | Update lesson |
| DELETE | `/admin/lessons/:id` | Delete lesson |

#### Quizzes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/admin/quizzes` | Create quiz |
| GET | `/admin/quizzes` | List quizzes |
| GET | `/admin/quizzes/:id` | Get quiz details |
| PUT | `/admin/quizzes/:id` | Update quiz |
| DELETE | `/admin/quizzes/:id` | Delete quiz |
| PATCH | `/admin/quizzes/:id/publish` | Publish quiz |
| GET | `/admin/quizzes/:id/submissions` | Get quiz submissions |
| GET | `/admin/quizzes/stats` | Get quiz statistics |

#### Assignments

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/admin/assignments` | Create assignment |
| GET | `/admin/assignments` | List assignments |
| GET | `/admin/assignments/:id` | Get assignment details |
| PUT | `/admin/assignments/:id` | Update assignment |
| DELETE | `/admin/assignments/:id` | Delete assignment |
| PATCH | `/admin/assignments/:id/publish` | Publish assignment |
| GET | `/admin/assignments/:id/submissions` | Get assignment submissions |
| PATCH | `/admin/assignments/:assignmentId/submissions/:submissionId/grade` | Grade assignment submission |

#### Batches

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/admin/batches` | Create batch |
| GET | `/admin/batches` | List batches |
| GET | `/admin/batches/:id` | Get batch details |
| PUT | `/admin/batches/:id` | Update batch |
| DELETE | `/admin/batches/:id` | Delete batch |

#### Users

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/users` | List users |
| GET | `/admin/users/:id` | Get user details |
| GET | `/admin/users/stats` | Get user statistics |

#### Orders

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/orders` | List orders |
| GET | `/admin/orders/:id` | Get order details |

---

## Project Structure

```
backend/
├── api/
│   ├── controllers/        # Request handlers
│   ├── middlewares/        # Express middleware
│   ├── routes/             # Route definitions
│   ├── validations/        # Zod validation schemas
│   └── errors/             # Error handling
├── config/                 # Configuration files
├── schema/                 # Mongoose schemas
├── .env                    # Environment variables
├── index.ts               # Entry point
├── tsconfig.json          # TypeScript config
└── package.json           # Dependencies
```

---

## Key Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Student, Admin)
- Secure password hashing with bcrypt

### Course Management
- Hierarchical structure: Courses → Modules → Lessons
- Publish/unpublish content
- Track lesson completion

### Quiz System
- Multiple question types (multiple-choice, true-false)
- Auto-grading for objective questions
- Question shuffling and option shuffling
- Attempt limiting and time limits
- Timezone-aware availability windows

### Assignment System
- Multiple submission types (text, file, link, code)
- Late submission handling with penalties
- Admin grading with feedback
- Grade visibility after grading

### Progress Tracking
- Student course progress percentage
- Lesson completion tracking
- Quiz and assignment statistics
- User engagement metrics

---

## Technology Stack

- **Runtime**: Node.js / Bun
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Language**: TypeScript
- **Authentication**: JWT (jwt-simple) + Passport
- **Validation**: Zod
- **Security**: Helmet, CORS, bcryptjs
- **Utilities**: moment-timezone, lodash, winston

---

## Development

### Build for Production

```bash
npm run build
```

This will:
1. Compile TypeScript to JavaScript
2. Resolve path aliases with `tsc-alias`

### Run Tests

```bash
# Configure MONGO_URI_TESTS in .env first
npm run test
```

---

## Support

For documentation on specific API features:
- **Student Quiz API**: See `STUDENT_QUIZ_API.md`
- **Student Assignment API**: See `STUDENT_ASSIGNMENT_API.md`
- **Student Course API**: See `STUDENT_API.md`

---

## License

Proprietary - Course Master

