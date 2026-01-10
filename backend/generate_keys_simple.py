"""
Simple VAPID key generator using cryptography library
"""
import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

def generate_vapid_keys():
    """Generate VAPID keys using cryptography library"""
    # Generate private key
    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    
    # Get public key
    public_key = private_key.public_key()
    
    # Serialize private key
    private_key_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Serialize public key in uncompressed format for Web Push
    public_key_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    
    # Base64 encode for web push
    public_key_b64 = base64.urlsafe_b64encode(public_key_bytes).decode('utf-8').rstrip('=')
    private_key_str = private_key_bytes.decode('utf-8')
    
    return public_key_b64, private_key_str

if __name__ == '__main__':
    print("=" * 60)
    print("Generating VAPID Keys...")
    print("=" * 60)
    
    try:
        public_key, private_key = generate_vapid_keys()
        
        print("\n✓ Keys generated successfully!")
        print("\n" + "=" * 60)
        print("Backend Keys (.env file):")
        print("=" * 60)
        print(f"\nVAPID_PUBLIC_KEY={public_key}")
        print(f"\nVAPID_PRIVATE_KEY=")
        print(private_key)
        print(f"VAPID_ADMIN_EMAIL=info@somasave.com")
        
        print("\n" + "=" * 60)
        print("Frontend Key (.env file):")
        print("=" * 60)
        print(f"\nVITE_VAPID_PUBLIC_KEY={public_key}")
        print("\n" + "=" * 60)
        
        # Save to files
        with open('backend_vapid_keys.txt', 'w') as f:
            f.write(f"VAPID_PUBLIC_KEY={public_key}\n\n")
            f.write(f"VAPID_PRIVATE_KEY=\n{private_key}\n")
            f.write(f"VAPID_ADMIN_EMAIL=info@somasave.com\n")
        
        with open('frontend_vapid_keys.txt', 'w') as f:
            f.write(f"VITE_VAPID_PUBLIC_KEY={public_key}\n")
        
        print("\n✓ Keys saved to backend_vapid_keys.txt and frontend_vapid_keys.txt")
        print("\n⚠️  IMPORTANT: Keep the private key secure!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()

