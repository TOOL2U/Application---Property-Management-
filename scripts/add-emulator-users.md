# Add Test Users to Firebase Emulator

## Manual Setup via Emulator UI

1. **Open Firebase Emulator UI**: http://127.0.0.1:4000
2. **Navigate to Firestore**: Click on "Firestore" tab
3. **Create Collection**: Click "Start collection" and name it `staff_accounts`

## Test Users to Add

### Admin User
```json
Document ID: admin_user
{
  "email": "shaun@siamoon.com",
  "passwordHash": "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.93iHSW",
  "name": "Shaun Ducker",
  "role": "admin",
  "department": "Management",
  "phone": "0933880630",
  "address": "50/2 moo 6, Koh Phangan, Surat Thani 84280",
  "isActive": true,
  "createdAt": "2025-01-15T12:00:00Z",
  "updatedAt": "2025-01-15T12:00:00Z",
  "lastLogin": null
}
```
**Password**: `admin123`

### Test User
```json
Document ID: test_user
{
  "email": "test@exam.com",
  "passwordHash": "$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
  "name": "Test User",
  "role": "staff",
  "department": "Testing",
  "phone": "0933880634",
  "address": "Test Address",
  "isActive": true,
  "createdAt": "2025-01-15T12:00:00Z",
  "updatedAt": "2025-01-15T12:00:00Z",
  "lastLogin": null
}
```
**Password**: `password123`

### Manager User
```json
Document ID: manager_user
{
  "email": "manager@siamoon.com",
  "passwordHash": "$2a$12$8k7QzKjrqVkFjKlM9mNpOeJ3kL5nP7qR8sT9uV0wX1yZ2aB3cD4eF",
  "name": "Property Manager",
  "role": "manager",
  "department": "Operations",
  "phone": "0933880631",
  "address": "Koh Phangan, Surat Thani",
  "isActive": true,
  "createdAt": "2025-01-15T12:00:00Z",
  "updatedAt": "2025-01-15T12:00:00Z",
  "lastLogin": null
}
```
**Password**: `manager123`

## Password Hashes

The password hashes above correspond to:
- `admin123` → `$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.93iHSW`
- `password123` → `$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi`
- `manager123` → `$2a$12$8k7QzKjrqVkFjKlM9mNpOeJ3kL5nP7qR8sT9uV0wX1yZ2aB3cD4eF`

## Steps to Add Users

1. **Open Emulator UI**: http://127.0.0.1:4000/firestore
2. **Create Collection**: Click "Start collection" → Enter `staff_accounts`
3. **Add Document**: Click "Add document"
4. **Set Document ID**: Use the IDs above (e.g., `admin_user`)
5. **Add Fields**: Copy the JSON fields above, setting correct types:
   - `email`: string
   - `passwordHash`: string
   - `name`: string
   - `role`: string
   - `department`: string
   - `phone`: string
   - `address`: string
   - `isActive`: boolean
   - `createdAt`: timestamp
   - `updatedAt`: timestamp
   - `lastLogin`: null

## Testing

After adding users, test authentication in the app:

1. **Open Application**: http://localhost:8083
2. **Navigate to Test Screen**: Use the UserTestScreen
3. **Test Login**: Use credentials above
4. **Check Results**: Verify authentication works

## Troubleshooting

- **User Not Found**: Check collection name is exactly `staff_accounts`
- **Password Mismatch**: Verify password hash is correct
- **Permission Denied**: Check Firestore rules are deployed
- **Connection Issues**: Ensure emulator is running on port 8080
