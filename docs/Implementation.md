# Implementation & Promotion: IntelliCare System

Welcome to the official implementation showcase of the **IntelliCare Hospital Appointment System**. This project is a modern, full-stack solution designed to streamline healthcare scheduling and resource management.

## Live Demo
Experience the live application here:
**[IntelliCare Live on Vercel](https://intellicare-resource-allocation5-if.vercel.app/)**

---

## What is IntelliCare?
IntelliCare was developed to smoothen the workflow of booking hospital appointments and ensure patients can visibly see the booking slots before arriving at the hospital for a checkup.

### Key Features for Patients
* **Intuitive Registration:** Secure account creation with built-in age and data validation.
* **Smart Search:** Filter doctors by specialty (e.g., Cardiology) to find the right care instantly.
* **Flexible Management:** Real-time booking, rescheduling (with 24-hour policy enforcement), and easy cancellations.

### Key Features for Administrators
* **Dynamic Resource Allocation:** Manage hospital rooms with real-time tracking.
* **Doctor Schedule Management:** Easily add shifts and assign them to specific consultation rooms.
* **Security & Audit Logs:** Monitor failed login attempts and suspicious activity to protect patient data.

---

## Client Feedback & Iteration
We demonstrate our solution to stakeholders at the end of each iteration to ensure we delivered "what was needed."

### Iteration 1 Feedback
* **Observation:** The initial login was too simple and lacked clear security feedback.
* **Action:** We implemented JWT (JSON Web Tokens) and added specific login error messages to improve security and user experience.

### Iteration 2 Feedback
* **Observation:** Administrators found it difficult to track room conflicts manually.
* **Action:** We will add an automated room-conflict checker that prevents two doctors from being assigned to the same room at the same time.

---

## Exemplary UI Design
IntelliCare features a mobile-responsive, clean interface built with **Tailwind CSS**. We focused on high-contrast elements and clear typography to ensure accessibility for all patients.