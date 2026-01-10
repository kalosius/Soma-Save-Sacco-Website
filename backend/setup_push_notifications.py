#!/usr/bin/env python
"""
Quick setup script for push notifications
"""
import os
import sys
import subprocess

def check_dependencies():
    """Check if required packages are installed"""
    print("Checking dependencies...")
    try:
        import pywebpush
        import py_vapid
        print("✓ Push notification packages are installed")
        return True
    except ImportError:
        print("✗ Push notification packages not found")
        return False

def install_dependencies():
    """Install required packages"""
    print("\nInstalling dependencies...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pywebpush', 'py-vapid'])
        print("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("✗ Failed to install dependencies")
        return False

def generate_keys():
    """Generate VAPID keys"""
    print("\nGenerating VAPID keys...")
    try:
        from py_vapid import Vapid
        
        vapid = Vapid()
        vapid.generate_keys()
        
        public_key = vapid.public_key.decode('utf-8')
        private_key = vapid.private_key.decode('utf-8')
        
        return public_key, private_key
    except Exception as e:
        print(f"✗ Failed to generate keys: {e}")
        return None, None

def create_env_template(public_key, private_key):
    """Create .env template with VAPID keys"""
    backend_env = f"""
# Add these to your backend/.env file:
VAPID_PUBLIC_KEY={public_key}
VAPID_PRIVATE_KEY={private_key}
VAPID_ADMIN_EMAIL=admin@somasave.com
"""
    
    frontend_env = f"""
# Add this to your frontend .env file:
VITE_VAPID_PUBLIC_KEY={public_key}
"""
    
    # Write to files
    with open('backend_vapid_keys.txt', 'w') as f:
        f.write(backend_env)
    
    with open('frontend_vapid_keys.txt', 'w') as f:
        f.write(frontend_env)
    
    print(f"\n✓ Keys saved to backend_vapid_keys.txt and frontend_vapid_keys.txt")

def run_migrations():
    """Run database migrations"""
    print("\nRunning database migrations...")
    try:
        os.chdir('backend')
        subprocess.check_call([sys.executable, 'manage.py', 'makemigrations'])
        subprocess.check_call([sys.executable, 'manage.py', 'migrate'])
        print("✓ Migrations completed successfully")
        return True
    except subprocess.CalledProcessError:
        print("✗ Migration failed")
        return False
    except FileNotFoundError:
        print("✗ Could not find manage.py. Make sure you're in the project root.")
        return False

def main():
    print("=" * 60)
    print("SomaSave Push Notifications Setup")
    print("=" * 60)
    
    # Check or install dependencies
    if not check_dependencies():
        response = input("\nInstall dependencies now? (y/n): ")
        if response.lower() == 'y':
            if not install_dependencies():
                print("\n✗ Setup failed. Please install dependencies manually:")
                print("  pip install pywebpush py-vapid")
                return
        else:
            print("\n✗ Setup cancelled. Please install dependencies manually.")
            return
    
    # Generate keys
    public_key, private_key = generate_keys()
    if not public_key:
        print("\n✗ Setup failed. Could not generate VAPID keys.")
        return
    
    # Display keys
    print("\n" + "=" * 60)
    print("VAPID Keys Generated Successfully!")
    print("=" * 60)
    print(f"\nPublic Key:  {public_key}")
    print(f"Private Key: {private_key}")
    print("\n⚠️  IMPORTANT: Keep the private key secure!")
    print("=" * 60)
    
    # Create env templates
    create_env_template(public_key, private_key)
    
    # Run migrations
    response = input("\nRun database migrations now? (y/n): ")
    if response.lower() == 'y':
        run_migrations()
    
    print("\n" + "=" * 60)
    print("Setup Complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Copy the keys from backend_vapid_keys.txt to backend/.env")
    print("2. Copy the key from frontend_vapid_keys.txt to .env")
    print("3. Restart your Django server")
    print("4. Build your frontend if necessary")
    print("\nSee PUSH_NOTIFICATIONS_GUIDE.md for detailed usage instructions.")
    print("=" * 60)

if __name__ == '__main__':
    main()
