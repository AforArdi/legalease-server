<div align="center">
  <h1>LegalEase Server</h1>
  <p><strong>The robust backend API powering the LegalEase platform.</strong></p>

  <p>
    <a href="https://client-legalease.vercel.app" target="_blank">View Live App</a>
    ·
    <a href="https://github.com/AforArdi/legalease-client" target="_blank">Frontend Repository</a>
  </p>
</div>

<br/>

## 📖 Overview

The **LegalEase Server** acts as the secure, high-performance backend architecture for the LegalEase platform. Built with Node.js and Express, it provides comprehensive RESTful APIs to handle role-based authentication, lawyer discovery, user hiring requests, verified reviews, and secure Stripe payments.

By interfacing directly with MongoDB and validating Better Auth JWT tokens (`jose`), this server ensures that sensitive legal data and user transactions remain completely protected.

---

## 🚀 Key Responsibilities

* **Role-Based Access Control (RBAC):** Middleware checks to verify JWT payloads and strictly enforce `user`, `lawyer`, and `admin` permissions on restricted routes.
* **Data Aggregation & Lookup:** Utilizes MongoDB aggregation pipelines (like `$lookup`) to seamlessly merge related collections (e.g., automatically attaching lawyer profile details to hiring requests).
* **Payment Verification:** Interacts with payment webhooks/checkouts to validate transactions and update the status of hiring requests dynamically.
* **Strict Review Validation:** Includes logic to ensure that comments on a lawyer's profile can only be posted by clients who have successfully completed the hiring and payment process.

---

## 🛠 Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (via official `mongodb` driver)
* **Security & Auth:** `jose-cjs` (for remote JWK token verification), `cors`, `dotenv`

---

## 🤝 Connect with the Developer

Built by **Mohammad Ardi**. If you have any questions, opportunities, or just want to chat about code:

<p align="left">
  <a href="https://www.linkedin.com/in/mohammad-ardi" target="_blank">
    <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
  <a href="mailto:miftahulislam9037@gmail.com">
    <img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Gmail" />
  </a>
</p>
