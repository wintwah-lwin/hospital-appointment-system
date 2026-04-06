# System Design

## Architecture

The Hospital Appointment System follows a three-tier architecture:

### Frontend
- React
- Tailwind CSS
- REST API calls

### Backend
- Node.js
- Express
- Authentication
- Business Logic

### Database
- MongoDB
- Mongoose Models

## Database Design

Main Entities:

- Users
- Doctors
- Appointments
- Notifications
- Login Events
- Rooms

Relationships:

- User books appointment
- Doctor has schedules
- Appointment assigned to doctor
- Admin manages users

## UI Design

UI was designed using Figma.

Main Pages:

### Patient

- Login Page
- Register Page
- Dashboard
- Doctor List
- Appointment Booking
- Appointment History

### Admin

- Admin Dashboard
- Manage Doctors
- Manage Schedule
- Manage Rooms
- View Appointments

Design Principles

- Simple UI
- Responsive Design
- Easy navigation
- Accessibility