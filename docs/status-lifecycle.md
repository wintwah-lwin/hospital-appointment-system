# Appointment status lifecycle

How appointment statuses move through the system (Singapore-style hospital queue flow).

## Main path

Booked → Checked-In → Waiting → In Consultation → Completed

## Other outcomes

- Booked → Cancelled (patient or admin cancels).
- Checked-In → No Show (patient does not proceed to consultation).

## What each status means

| Status | Meaning |
|--------|---------|
| Booked | Confirmed booking. Reminders may go out before the visit. Patient can reschedule or cancel. |
| Checked-In | Patient arrived (kiosk or counter). A queue number is assigned. |
| Waiting | Patient is in the waiting area. Queue order typically uses priority, appointment time, then check-in time. |
| In Consultation | Doctor has called the patient in; visit in progress. |
| Completed | Visit finished. Patient may be directed to pharmacy, payment, or booking a follow-up. |

## Queue categories (typical in SG hospitals)

- New — first visit for this condition or service.
- Follow-up — return visit.
- Priority — for example elderly or urgent cases.
