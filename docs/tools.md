# Building Tools & External Libraries

The IntelliCare system was built using a professional **MERN Stack** (MongoDB, Express, React, Node.js). Each tool was chosen for its ability to provide a scalable and secure healthcare environment.

## Core Technology Stack

### 1. Frontend: React.js & Tailwind CSS
* React allows for a component-based architecture, meaning we can reuse elements like the "Appointment Card" or "Sidebar" throughout the app.
* We used **React Hooks** (useState, useEffect) to manage the patient's state and **Tailwind CSS** for rapid, responsive UI development.

### 2. Backend: Node.js & Express
* Node.js provides a non-blocking environment that is perfect for handling multiple simultaneous booking requests.
* We built a RESTful API where Express routes connect frontend requests to our database logic.

### 3. Database: MongoDB & Mongoose
* A NoSQL database like MongoDB is flexible, allowing us to store complex appointment and user data efficiently.
* We used **Mongoose** to create strict schemas, ensuring data integrity across the platform.

---

## Security & Deployment Tools

### 4. JSON Web Tokens (JWT)
* To protect the Admin Dashboard. When a user logs in, the server issues a secret token. Our **Middleware** checks this token for every request to ensure the user is authorized.

### 5. Vercel (Deployment)
* We connected our GitHub repository to **Vercel** for continuous deployment. Every time we "Push" code to the main branch, Vercel automatically builds and updates the live website.

### 6. Git & GitHub
* We used Git for version control, following a branching strategy to ensure that experimental code did not break the main "Stable" version.