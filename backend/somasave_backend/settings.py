from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-fallback-dev-key-do-not-use-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'cloudinary',
    'api',
    'shop',
]

# Custom user model
AUTH_USER_MODEL = 'api.CustomUser'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
# Use simple static files storage in dev to avoid needing collectstatic
if DEBUG:
    STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"
else:
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"


ROOT_URLCONF = 'somasave_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'somasave_backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }



# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "https://somasave.com",
    "https://www.somasave.com",
    "https://somasave.up.railway.app",
    "https://www.somasave.up.railway.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

# Additional CORS headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# CORS allowed methods
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# CSRF settings
CSRF_TRUSTED_ORIGINS = [
    "https://somasave.com",
    "https://www.somasave.com",
    "https://soma-save-sacco-website-production.up.railway.app",
    "https://somasave.up.railway.app",
    "https://www.somasave.up.railway.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Session settings
# In local dev (DEBUG=True, HTTP), SameSite must be 'Lax' and Secure must be False
SESSION_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'
SESSION_COOKIE_SECURE = False if DEBUG else True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_COOKIE_DOMAIN = None  # Allow cookies for localhost
SESSION_COOKIE_PATH = '/'
SESSION_SAVE_EVERY_REQUEST = True

# CSRF settings
CSRF_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'
CSRF_COOKIE_SECURE = False if DEBUG else True
CSRF_COOKIE_HTTPONLY = False  # Must be False so JavaScript can read it
CSRF_COOKIE_DOMAIN = None

# File Upload Settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api.authentication.CsrfExemptSessionAuthentication',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
}

# Email Configuration
# Use Resend for production (Railway blocks SMTP), SMTP for local development
RESEND_API_KEY = os.getenv('RESEND_API_KEY')

# Auto-detect: If RESEND_API_KEY is set, use Resend. Otherwise use SMTP.
# You can explicitly set USE_RESEND=True/False to override
USE_RESEND_ENV = os.getenv('USE_RESEND', None)
if USE_RESEND_ENV is not None:
    USE_RESEND = USE_RESEND_ENV == 'True'
else:
    # Auto-detect: Use Resend if API key is available
    USE_RESEND = bool(RESEND_API_KEY)

# Use console email backend in dev so emails print to terminal instead of requiring SMTP
if DEBUG:
    EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.zoho.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'False') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'info@somasave.com')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')

DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'SomaSave SACCO <info@somasave.com>')
SERVER_EMAIL = os.getenv('SERVER_EMAIL', 'info@somasave.com')
EMAIL_TIMEOUT = 30  # 30 seconds timeout for email operations

# Frontend URL for password reset links
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

# Log email configuration on startup
import logging
logger = logging.getLogger(__name__)
logger.info(f"=" * 60)
logger.info(f"EMAIL CONFIGURATION:")
logger.info(f"USE_RESEND: {USE_RESEND}")
logger.info(f"RESEND_API_KEY configured: {bool(RESEND_API_KEY)}")
logger.info(f"EMAIL_HOST: {EMAIL_HOST}")
logger.info(f"EMAIL_PORT: {EMAIL_PORT}")
logger.info(f"EMAIL_HOST_USER: {EMAIL_HOST_USER}")
logger.info(f"EMAIL_HOST_PASSWORD configured: {bool(EMAIL_HOST_PASSWORD)}")
logger.info(f"DEFAULT_FROM_EMAIL: {DEFAULT_FROM_EMAIL}")
logger.info(f"FRONTEND_URL: {FRONTEND_URL}")
logger.info(f"=" * 60)

# Cloudinary Configuration
import cloudinary
import cloudinary.uploader
import cloudinary.api


cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME', 'dhgjydahn'),
    api_key=os.getenv('CLOUDINARY_API_KEY', '617993754119547'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET', 'Y7X7ttx7sw6XPkqAjS04-sa6qHc'),
    secure=True
)

# Relworx Payment Gateway Configuration
RELWORX_API_KEY = os.getenv('RELWORX_API_KEY', '55cbd4454b75ef.4MsHHl_YCvRQnCYdF0ybmA')
RELWORX_ACCOUNT_NO = os.getenv('RELWORX_ACCOUNT_NO', 'RELEAE2072EE4')
RELWORX_WEBHOOK_KEY = os.getenv('RELWORX_WEBHOOK_KEY', '191dc8aec53073d24fbd357368')
RELWORX_API_URL = 'https://payments.relworx.com/api'

logger.info("=" * 60)
logger.info("RELWORX PAYMENT CONFIGURATION")
logger.info(f"RELWORX_API_KEY configured: {bool(RELWORX_API_KEY)}")
logger.info(f"RELWORX_ACCOUNT_NO: {RELWORX_ACCOUNT_NO}")
logger.info(f"RELWORX_WEBHOOK_KEY configured: {bool(RELWORX_WEBHOOK_KEY)}")
logger.info("=" * 60)

# VAPID Configuration for Push Notifications
VAPID_PUBLIC_KEY = os.getenv('VAPID_PUBLIC_KEY', '')
VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY', '')
VAPID_ADMIN_EMAIL = os.getenv('VAPID_ADMIN_EMAIL', 'info@somasave.com')

logger.info("=" * 60)
logger.info("PUSH NOTIFICATIONS CONFIGURATION")
logger.info(f"VAPID_PUBLIC_KEY configured: {bool(VAPID_PUBLIC_KEY)}")
logger.info(f"VAPID_PRIVATE_KEY configured: {bool(VAPID_PRIVATE_KEY)}")
logger.info(f"VAPID_ADMIN_EMAIL: {VAPID_ADMIN_EMAIL}")
logger.info("=" * 60)
