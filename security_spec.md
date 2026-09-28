# Security Specification

## 1. Data Invariants
- Tasks must belong to an authenticated user (`userId == request.auth.uid`).
- A task can only be read, created, updated, or deleted by its creator (`resource.data.userId == request.auth.uid`).
- List queries on `/tasks` must enforce `resource.data.userId == request.auth.uid` to prevent unauthorized query scraping.
- `createdAt` is immutable upon update (`incoming().createdAt == existing().createdAt`).
- `userId` is immutable upon update (`incoming().userId == existing().userId`).
- User profile at `/users/{userId}` can only be accessed and mutated by the authentic owner (`request.auth.uid == userId`).
- All string and ID fields are strictly constrained by length (`isValidId`, `maxLength`).
- Default-deny catch-all rule `match /{document=**} { allow read, write: if false; }` at root.

## 2. Dirty Dozen Payloads (Targeting Exploits)
1. **Unauthenticated Read on Task**: Request without auth token. (Expect: PERMISSION_DENIED)
2. **Cross-Tenant Task Read**: User B attempts `get` on Task belonging to User A. (Expect: PERMISSION_DENIED)
3. **Spoofed Owner Write**: User B creates task with `userId: "user_a"`. (Expect: PERMISSION_DENIED)
4. **List All Tasks Snooping**: User queries `/tasks` without isolating `where('userId', '==', user.uid)`. (Expect: PERMISSION_DENIED)
5. **Ownership Hijack on Update**: User A tries to change `userId` to User B. (Expect: PERMISSION_DENIED)
6. **Immutable createdAt Tampering**: User A updates `createdAt` to arbitrary timestamp. (Expect: PERMISSION_DENIED)
7. **Oversized Title Buffer Attack**: User attempts to store a 50KB title string. (Expect: PERMISSION_DENIED)
8. **Malicious ID Injection**: Path parameter `/tasks/{taskId}` containing path traversal or 10KB string. (Expect: PERMISSION_DENIED)
9. **Private Profile Read by Third Party**: User B tries to view `/users/{userAId}` profile. (Expect: PERMISSION_DENIED)
10. **Ghost Field / Shadow Key Injection**: Create payload with unknown arbitrary malicious key `isAdmin: true`. (Expect: PERMISSION_DENIED)
11. **Invalid Priority Enum**: Creating task with `priority: "super-extreme-god-mode"`. (Expect: PERMISSION_DENIED)
12. **Unverified Email Bypass**: Creating tasks when authentication is anonymous or unverified (when strict verification is enforced). (Expect: PERMISSION_DENIED)
