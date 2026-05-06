# Security Specification - Networking Hub

## Data Invariants
1. A **BlogPost** must have an `authorId` matching the authenticated user's UID.
2. A **Comment** must be associated with a valid `postId`.
3. **Likes** are strictly one-per-user-per-post and must be stored in the subcollection.
4. **User Roles** (admin) can only be granted by the Master Admin (hardcoded bootstrap) or an existing Admin.
5. **PII Isolation**: User emails should not be publicly scrapeable.

## The "Dirty Dozen" Payloads

### 1. Identity Spoofing (Owner Takeover)
Attempt to create a post with another user's `authorId`.
```json
{
  "title": "Hack",
  "slug": "hack",
  "content": "Malicious",
  "authorId": "victim_uid_123",
  "createdAt": "2026-05-05T22:00:00Z",
  "updatedAt": "2026-05-05T22:00:00Z",
  "published": true
}
```
*Expected Result: PERMISSION_DENIED*

### 2. Privilege Escalation (Self-Admin)
Attempt to update own profile to set `role: "admin"`.
```json
{
  "role": "admin"
}
```
*Expected Result: PERMISSION_DENIED*

### 3. State Shortcutting (Bypass Approval)
Attempt to publish a post if publishing required an admin (though here it's owner-controlled, let's assume we want to guard status if it existed).

### 4. Shadow Field Injection (Ghost Verification)
Attempt to add a `verified: true` field to a post.
```json
{
  "title": "Nice Post",
  "slug": "nice-post",
  "content": "Content",
  "authorId": "my_uid",
  "createdAt": "2026-05-05T22:00:00Z",
  "updatedAt": "2026-05-05T22:00:00Z",
  "published": true,
  "isVerified": true
}
```
*Expected Result: PERMISSION_DENIED (via strict key check)*

### 5. Denial of Wallet (Resource Poisoning)
Attempt to create a document ID that is extremely large.
*Expected Result: PERMISSION_DENIED (via isValidId size check)*

### 6. Denial of Wallet (Payload Bloat)
Attempt to send a 1MB string in `displayName`.
```json
{
  "displayName": "A...[1MB]..."
}
```
*Expected Result: PERMISSION_DENIED (via .size() check)*

### 7. PII Blanket (Scraping Emails)
Attempt to list all users to get their emails.
*Expected Result: PERMISSION_DENIED (only admins should list)*

### 8. Orphaned Comment
Attempt to create a comment for a post ID that doesn't follow the ID regex.
```json
{
  "postId": "!!!invalid!!!",
  "content": "Oops"
}
```
*Expected Result: PERMISSION_DENIED (via isValidId check on related fields if implemented)*

### 9. Suspended Write
Attempt to write to `posts` while the user document has `suspended: true`.
*Expected Result: PERMISSION_DENIED*

### 10. Immutable Field Modification
Attempt to change `createdAt` on an existing post.
*Expected Result: PERMISSION_DENIED*

### 11. Unverified Admin Access
Attempt to perform admin actions with a spoofed email but `email_verified: false`.
*Expected Result: PERMISSION_DENIED*

### 12. Cross-Post Like Injection
Attempt to create a like in another user's subcollection.
*Expected Result: PERMISSION_DENIED*

## Recommendations for Hardening
- Implement `isValidId()` check on `postId` field inside `comments` creation.
- Restrict `users/{userId}` read to only return `displayName`, `photoURL`, `bio`, and `role`. Block `email` if it's considered PII that shouldn't be public. 
- Ensure `isMasterAdmin`/`isAdmin` checks `email_verified == true`.
