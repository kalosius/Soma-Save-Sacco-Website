"""
Script to generate VAPID keys for web push notifications
Run this once and save the keys in your .env file
"""
from py_vapid import Vapid

def generate_vapid_keys():
    """Generate VAPID keys"""
    vapid = Vapid()
    vapid.generate_keys()
    
    public_key = vapid.public_key.decode('utf-8')
    private_key = vapid.private_key.decode('utf-8')
    
    print("=" * 60)
    print("VAPID Keys Generated Successfully!")
    print("=" * 60)
    print("\nAdd these to your backend/.env file:")
    print("-" * 60)
    print(f"VAPID_PUBLIC_KEY={public_key}")
    print(f"VAPID_PRIVATE_KEY={private_key}")
    print(f"VAPID_ADMIN_EMAIL=admin@somasave.com")
    print("-" * 60)
    print("\nAdd this to your frontend .env file:")
    print("-" * 60)
    print(f"VITE_VAPID_PUBLIC_KEY={public_key}")
    print("-" * 60)
    print("\n⚠️  IMPORTANT: Keep the private key secure and never commit it to version control!")
    print("=" * 60)
    
    return {
        'public_key': public_key,
        'private_key': private_key
    }

if __name__ == '__main__':
    generate_vapid_keys()
