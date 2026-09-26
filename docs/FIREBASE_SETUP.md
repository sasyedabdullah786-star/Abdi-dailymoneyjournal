# Firebase Setup & Deployment Guide

## 1. Required Firebase Services
- **Firebase Authentication**: Email/Password authentication enabled.
- **Cloud Firestore**: Enterprise or Standard edition database for persistent storage.
- **Firebase Storage**: For hosting APK files and downloadable assets.

## 2. Firestore Collections Schema
| Collection | Document ID | Purpose |
|---|---|---|
| `appSettings` | `main` | Global application metadata, current APK version, file size, and download URL. |
| `websiteSettings` | `main` | Landing page copy, announcement banner state, and support contact details. |
| `releases` | `releaseId` (e.g. `rel_2_4_0`) | Version changelogs, build codes, binary hashes (SHA-256), and file links. |
| `downloads` | Auto-generated (`dl_...`) | Download logs recording version, device platform, and timestamp. |
| `users` | `uid` | User profiles with authentication ID, email, display name, and assigned role (`admin` or `user`). |
| `admins` | `uid` | Whitelist document granting administrative access. |
| `transactions` | `transactionId` | User financial entries (income/expense, amount, category, date, time). |
| `pending_money` | `pendingId` | Tracked debts and receivables with settlement triggers. |
| `user_notes` | `userId` | User smart financial notes. |

## 3. Storage Structure
- `apks/` - Production Android APK releases (e.g. `daily-money-journal-v2.4.0.apk`)
- `branding/` - Application logos and banners
- `screenshots/` - App preview screenshots

## 4. Admin Role Configuration
- The user account `s.asyedabdullah786@gmail.com` is configured as the bootstrap administrator.
- Upon signing in or signing up with this email address, the system automatically assigns the `admin` role in Firestore and grants access to the `/admin` portal.

## 5. Building Native Android APK with Capacitor
```bash
# 1. Compile the production web assets
npm run build

# 2. Sync to Android project
npx cap sync android

# 3. Open in Android Studio or compile APK
npx cap build android
```
