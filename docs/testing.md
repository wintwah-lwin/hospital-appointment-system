# Testing Documentation: Test-Driven Development (TDD) Log
---

## 1. Patient Portal TDD Results

These tests ensure the patient experience is smooth and follow the rules for registration and booking.

| ID | Requirement (Feature) | Test Input (Red Phase) | Expected Result (Green Phase) | Status |
| :--- | :--- | :--- | :--- | :--- |
| P-01 | Account Creation | Email, DOB, Name, Password | Account created; "Welcome [name]" | Pass |
| P-02 | Field Validation | NULL (Empty fields) | Message: "Please fill out this field." | Pass |
| P-03 | Age Restriction | DOB as "2026" | Error: "Must be at least 16 years old." | Pass |
| P-04 | Password Strength | 1 character | Error: "Must be at least 8 characters." | Pass |
| P-05 | Login Security | NULL inputs | Message: "Please fill out this field" | Pass |
| P-06 | Login Authentication | test@gmail.com / test123 | Error: "Invalid email or password" | Pass |
| P-07 | Email Formatting | "test" (no @) | Browser warning: "Please put an @" | Pass |
| P-08 | Valid Login | test@gmail.com / test12345 | Redirect to home; "Welcome tester" | Pass |
| P-09 | Specialty Filter | Click "Cardiology" | Shows list of only cardiologists | Pass |
| P-10 | Referral Check | NULL referral type | Message: "Please select referral type" | Pass |
| P-11 | Appointment Booking | Confirm booking | Message: "Booking confirmed" | Pass |
| P-12 | Reschedule Limit | Reschedule < 24 hours | Error: "Must be at least 24 hours before." | Pass |
| P-13 | Cancellation | Click cancel button | Status updates to "Cancelled" | Pass |
| P-14 | Password Change | Incorrect current pass | Error: "Current password is incorrect" | Pass |
| P-15 | Password Matching | test12345 / test123 | Error: "Passwords do not match" | Pass |
| P-16 | Forgot Password | Click forgot password | Request submitted successfully | Pass |
| P-17 | Password Update | Valid new password entries | Message: "Password updated" | Pass |

---

## 2. Admin Portal TDD Results

These tests ensure that administrators can manage hospital resources and keep the system secure.

| ID | Requirement (Feature) | Test Input (Red Phase) | Expected Result (Green Phase) | Status |
| :--- | :--- | :--- | :--- | :--- |
| A-01 | Add Doctor Validation | NULL entries | Message: "Please fill out this field" | Pass |
| A-02 | Doctor Availability | No time slot chosen | Message: "Please select a time slot." | Pass |
| A-03 | Room Conflicts | Mon 9am Room-1 (Taken) | Error: "Please choose another time/room." | Pass |
| A-04 | Valid Doctor Entry | Dr Green, General, Tue 5pm | Doctor added to the official list | Pass |
| A-05 | Edit Schedule | Remove Tue 5pm Slot | Timetable updates immediately | Pass |
| A-06 | Remove Doctor | Remove Dr Green | Doctor profile deleted from system | Pass |
| A-07 | Timetable Filtering | Click "Tuesday" | Only Tuesday slots are displayed | Pass |
| A-08 | Appointment Filter | Check 13/04/2026 | List shows only that date's bookings | Pass |
| A-09 | Check-in Workflow | Click "Check In" | Status updates to "Checked In" | Pass |
| A-10 | Admin Cancellation | Click "Cancel" | Status updates to "Cancelled" | Pass |
| A-11 | Data Archiving | Click "Delete" | Record moved to archived bookings | Pass |
| A-12 | Load Filter (Doctor) | Click "Dr Loui" | Only Dr Loui's records are shown | Pass |
| A-13 | Load Filter (Time) | Click "9am" | Only 9am records are shown | Pass |
| A-14 | Detail View | Click "View Details" | Full appointment details are displayed | Pass |
| A-15 | Room Management | Click "Room 2" | Show Room 2 appointments only | Pass |
| A-16 | Security Audit | Click "Failed" | Show failed login attempts list | Pass |
| A-17 | Doctor Profiles | Click "Dr Loui" | Dr Loui's details are shown | Pass |
| A-18 | Search Logic | Type "Dr Loui" | Filter list to show only Dr Loui | Pass |
| A-19 | Patient Profiles | Click "John" | Show John’s details and history | Pass |
| A-20 | Patient Search | Type "John" | Filter list to show only John’s records | Pass |
| A-21 | Account Security | Click "Ban Tester" | Account is blocked from logging in | Pass |
| A-22 | Account Deletion | Click "Delete" | Account is permanently removed | Pass |
| A-23 | Password Reset | Click "Send Link" | Reset link sent to user successfully | Pass |

---