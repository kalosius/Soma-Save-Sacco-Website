from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Session authentication that doesn't enforce CSRF for safe methods (GET, HEAD, OPTIONS)
    """
    def authenticate(self, request):
        # Debug logging
        print(f"=== Authentication Debug ===")
        print(f"Session key: {request.session.session_key if hasattr(request, 'session') else 'No session'}")
        print(f"Session items: {dict(request.session) if hasattr(request, 'session') else 'No session'}")
        print(f"Cookies: {request.COOKIES}")
        
        # Get the user from the underlying Django request
        user = getattr(request._request, 'user', None)
        
        print(f"User from request: {user}")
        print(f"Is authenticated: {user.is_authenticated if user else False}")
        print(f"===========================")
        
        # Call parent authentication which returns (user, None) tuple or None
        result = super().authenticate(request)
        
        if result is not None:
            print(f"Authentication successful: {result[0]}")
        else:
            print(f"Authentication failed - no result from parent")
            
        return result
    
    def enforce_csrf(self, request):
        # Skip CSRF check for safe methods
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return
        return super().enforce_csrf(request)
