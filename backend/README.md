# Django Backend for Soma Save SACCO

This is the Django REST API backend for the Soma Save SACCO website.

## Setup Instructions

### 1. Create a Virtual Environment

```bash
python -m venv venv
```

### 2. Activate the Virtual Environment

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
venv\Scripts\activate.bat
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create a Superuser

```bash
python manage.py createsuperuser
```

### 6. Run the Development Server

```bash
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register a new member
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/user/` - Get current user info
- `POST /api/password-reset/` - Request password reset
- `POST /api/password-reset-confirm/` - Confirm password reset

### Members
- `GET /api/members/` - List all members (staff only)
- `GET /api/members/me/` - Get current member profile
- `GET /api/members/{id}/` - Get member details
- `PUT /api/members/{id}/` - Update member
- `DELETE /api/members/{id}/` - Delete member

### Loans
- `GET /api/loans/` - List loans (filtered by user)
- `POST /api/loans/` - Apply for a loan
- `GET /api/loans/{id}/` - Get loan details
- `PUT /api/loans/{id}/` - Update loan
- `POST /api/loans/{id}/approve/` - Approve loan (staff only)
- `DELETE /api/loans/{id}/` - Delete loan

### Transactions
- `GET /api/transactions/` - List transactions (filtered by user)
- `POST /api/transactions/` - Create transaction
- `GET /api/transactions/{id}/` - Get transaction details

## 📧 Email Configuration

### Local Development (SMTP)
Create a `.env` file in the backend directory:

```bash
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (optional - uses SQLite by default)
DB_NAME=somasave
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432

# SMTP Configuration (Zoho)
EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=587
EMAIL_HOST_USER=info@somasave.com
EMAIL_HOST_PASSWORD=your-app-password-here
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=SomaSave SACCO <info@somasave.com>
SERVER_EMAIL=info@somasave.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Railway Production (Resend API)

**⚠️ IMPORTANT:** Railway blocks SMTP ports. You MUST use Resend API.

See `RAILWAY_QUICK_SETUP.md` for detailed instructions.

Quick setup:
1. Get Resend API key from https://resend.com
2. Add to Railway Variables:
```bash
RESEND_API_KEY=re_your_key_here
USE_RESEND=True
DEFAULT_FROM_EMAIL=SomaSave SACCO <info@somasave.com>
FRONTEND_URL=https://somasave.com
```

### Test Email Configuration

Run the test script:
```bash
python test_email_config.py
```

This will verify your email setup before deployment.

## 🚂 Railway Deployment

1. **Read the guides:**
   - `RAILWAY_QUICK_SETUP.md` - Quick reference
   - `RAILWAY_DEPLOYMENT_GUIDE.md` - Detailed instructions

2. **Set environment variables in Railway**

3. **Deploy and test:**
   ```bash
   # Check logs
   railway logs --follow
   
   # Test password reset
   curl -X POST https://your-app.railway.app/api/password-reset/ \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

## Admin Panel

Access the Django admin panel at `http://127.0.0.1:8000/admin/`

## Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── somasave_backend/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
└── api/
    ├── __init__.py
    ├── admin.py
    ├── apps.py
    ├── models.py
    ├── serializers.py
    ├── views.py
    ├── urls.py
    ├── tests.py
    └── migrations/
```

## Models

### Member
- User profile with member number, phone, ID number, address
- Tracks savings and shares balance
- Linked to Django User model

### Loan
- Loan applications with type, amount, duration
- Status tracking (pending, approved, rejected, disbursed, completed)
- Interest rate and repayment tracking

### Transaction
- All financial transactions (deposits, withdrawals, loan payments)
- Linked to members and loans
- Reference number tracking

## Configuration

Update `somasave_backend/settings.py` for production:
- Change `SECRET_KEY`
- Set `DEBUG = False`
- Update `ALLOWED_HOSTS`
- Configure database (PostgreSQL recommended)
- Update CORS settings
