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
