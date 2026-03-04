# Singapore-Style Appointment Status Lifecycle

## Full status flow

```
Booked → Checked-In → Waiting → In Consultation → Completed
```

## Alternate transitions

- **Booked** → **Cancelled** (patient or admin cancels)
- **Checked-In** → **No Show** (patient leaves before consultation)

## Flow description

| Status | Description |
|--------|-------------|
| **Booked** | Appointment confirmed after pre-visit booking. Pre-appointment reminders sent 24–48 hrs before. Allows reschedule/cancel. |
| **Checked-In** | Patient arrived, scanned NRIC/barcode at kiosk or checked in at counter. Queue number generated. |
| **Waiting** | Patient in waiting area. Queue ordered by: Priority level → Appointment time → Check-in time. |
| **In Consultation** | Doctor called patient. Consultation in progress. |
| **Completed** | Consultation finished. Patient routed to Pharmacy, Payment, or Next appointment booking. |

## Queue types (SG hospitals)

- **New** – First-time cases
- **Follow-up** – Return visits
- **Priority** – Elderly, urgent
