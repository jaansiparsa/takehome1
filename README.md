# 📁 tRPC File & Folder Access API

This project implements a secure file and folder management API using **tRPC** and **Zod** for input validation. It features a reusable permissions system using **middleware**, allowing clean and consistent access control logic across the API.

---

## 🚀 Features

- ✅ Create, move, and share files & folders
- 🔐 Reusable access control middleware for files and folders
- 👥 User-level permission checks (with recursive folder access)
- ♻️ Prevents circular folder structures
- 🧪 Dev utilities to get all users, files, and folders
- ⏱️ Timestamp injection for auditability

---

## 🧠 Edge Cases Considered

This project anticipates and handles several common and complex edge cases:

### 🔒 Permission Checks

- ✅ Prevents unauthorized file/folder access using middleware
- ✅ Recursive permission checking: if a user has access to a parent folder, they can access its children
- ❌ Returns `FORBIDDEN` error if user lacks access

### 📁 File Handling

- ✅ Handles file creation with or without a parent folder
- ❌ Prevents file move if destination folder access is not granted
- ❌ Ensures a file exists before any operation using `TRPCError: NOT_FOUND`

### 📂 Folder Handling

- ❌ Prevents folder move into itself (self-parenting)
- ❌ Prevents creation of circular folder structures (e.g., A → B → A)
- ✅ Handles folders with or without parent folders
- ✅ Shares folders recursively including all subfolders and files
- ❌ Prevents sharing if user does not have permission

### 🛑 Safety & Robustness

- ✅ Middleware short-circuits early to prevent unnecessary DB operations
- ❌ Throws meaningful `TRPCError` with `code` and `message` for all failure scenarios
- ✅ Uses input validation (`zod`) to enforce correct data shapes

---

## 📦 API Overview

### `createUser`
- ✅ Creates a user with an optional ID
- 🕒 Uses middleware to attach a timestamp to the request context

### `createFile`
- 📝 Creates a file and attaches it to a folder if provided
- 🔐 Checks if user has access to the parent folder

### `getFile`
- 🔐 Middleware-enforced file access check
- 📦 Returns file object

### `moveFile`
- 🔁 Moves a file to a new folder (or no folder)
- 🔐 Requires access to both source file and destination folder

### `shareFile`
- 🤝 Grants another user access to a file
- 🔐 Only allowed by users with access to the file

### `createFolder`
- 📂 Creates a new folder and optionally nests it
- 🔐 User must have access to parent folder

### `moveFolder`
- 🔁 Moves a folder to a new location
- ❌ Prevents circular nesting or moving into self
- 🔐 Requires access to both source and destination

### `shareFolder`
- 🔄 Shares a folder (and its entire subtree) with another user
- 🔐 Requires access to the root folder

### `getAllFiles`, `getAllFolders`, `getAllUsers`
- 🧪 Debug endpoints that return all entities

---

## 🧩 Middleware Highlights

### `procedureWithTime`
- Adds a `time` field to context for use in downstream procedures

### `withFileAccess`, `withFolderAccess`
- ✅ Fetches file/folder
- 🔐 Checks if user has access
- 🧠 Recursively checks parents for access
- ➕ Adds `user`, `file` or `folder` to context

---

## 🛠 Utilities Used

- `utils.getFile`, `getFolder`, `createUser`, `createFile`, etc.
- Custom utility layer for interacting with storage/database
- Abstracted to allow mocking in tests or swapping databases

---

## 🧪 Development / Debugging

The router exposes utility endpoints:

```ts
getAllUsers
getAllFiles
getAllFolders
