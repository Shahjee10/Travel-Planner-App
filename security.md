# 🔐 Security Note: Resolving Cross-User Data Access Issue

## ❌ Problem Overview

Initially, our backend allowed users to create, read, or modify trip data without verifying **ownership**. This created a security issue where one authenticated user could access or update **another user's trip**.

---

## ✅ How We Resolved It

We added **backend authorization middleware** that ensures:

- The JWT token (attached in request headers) is verified.
- The `userId` from the token is compared with the `userId` on the trip being accessed or modified.

This was added to sensitive routes like:
- `GET /trips/:id`
- `PUT /trips/:id`
- `DELETE /trips/:id`

Example check:

```js
if (trip.userId.toString() !== req.user.id) {
  return res.status(403).json({ message: 'Unauthorized access to this trip' });
}


 Best Practices Moving Forward
🔐 Backend
Always extract and verify the user ID from the JWT before performing DB actions.

Filter DB queries using userId to only return user-specific records.

Don’t rely on frontend to send userId; derive it from the token instead.

📲 Frontend
Store JWT securely using SecureStore or AsyncStorage.

Attach the token to every protected request using Authorization: Bearer <token>.

Handle 401 or 403 errors gracefully by logging out the user or showing appropriate messages.

⚠️ Common Mistakes to Avoid
Allowing routes to query the DB without checking user ownership.

Forgetting to add .interceptors.request.use() in Axios setup.

Using hardcoded user IDs or trusting frontend-provided data.

Testing only with one user — always test with multiple accounts.

📌 Summary
We’ve now implemented strong access controls to prevent cross-user data leaks. Always verify ownership before exposing or modifying any sensitive data.