"""
Relworx Payment Gateway Integration Module
Handles all interactions with Relworx Payments API
"""
import requests
import logging
import hashlib
import hmac
from django.conf import settings

logger = logging.getLogger(__name__)


class RelworxPaymentGateway:
    """Wrapper for Relworx Payments API"""
    
    def __init__(self):
        self.api_url = settings.RELWORX_API_URL
        self.api_key = settings.RELWORX_API_KEY
        self.account_no = settings.RELWORX_ACCOUNT_NO
        self.webhook_key = settings.RELWORX_WEBHOOK_KEY
    
    def _get_headers(self):
        """Generate request headers for Relworx API"""
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {self.api_key}'
        }
    
    def request_payment(self, reference, msisdn, currency, amount, description=None):
        """
        Request payment from mobile money subscriber
        
        Args:
            reference (str): Unique transaction reference (8-36 characters)
            msisdn (str): Phone number in international format (e.g., +256701345678)
            currency (str): 3-letter ISO currency code (UGX, KES, TZS, RWF)
            amount (float): Amount to deduct
            description (str, optional): Transaction description
        
        Returns:
            dict: Response from Relworx API
        """
        url = f"{self.api_url}/mobile-money/request-payment"
        
        payload = {
            "account_no": self.account_no,
            "reference": reference,
            "msisdn": msisdn,
            "currency": currency,
            "amount": float(amount),
        }
        
        if description:
            payload["description"] = description
        
        logger.info(f"Requesting payment from Relworx: {reference}, {msisdn}, {currency} {amount}")
        logger.info(f"Relworx URL: {url}")
        logger.info(f"Relworx Payload: {payload}")
        logger.info(f"Relworx Headers: {self._get_headers()}")
        
        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=30)
            logger.info(f"Relworx Response Status: {response.status_code}")
            logger.info(f"Relworx Response Text: {response.text}")
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Relworx payment request successful: {data}")
            return {
                'success': True,
                'data': data
            }
            
        except requests.exceptions.HTTPError as e:
            error_message = str(e)
            logger.error(f"Relworx HTTP Error Status: {e.response.status_code}")
            logger.error(f"Relworx HTTP Error Response: {e.response.text}")
            try:
                error_data = e.response.json()
                error_message = error_data.get('message', str(e))
                logger.error(f"Relworx API error JSON: {error_data}")
            except:
                logger.error(f"Relworx API error (non-JSON): {e.response.text}")
            
            return {
                'success': False,
                'error': error_message,
                'status_code': e.response.status_code
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Relworx request failed: {str(e)}")
            return {
                'success': False,
                'error': f"Payment request failed: {str(e)}"
            }
    
    def check_request_status(self, internal_reference=None, customer_reference=None):
        """
        Check the status of a payment request
        
        Args:
            internal_reference (str): Relworx internal reference
            customer_reference (str): Your transaction reference
        
        Returns:
            dict: Transaction status information
        """
        url = f"{self.api_url}/payment-requests/status"
        
        params = {
            "account_no": self.account_no
        }
        
        if internal_reference:
            params["internal_reference"] = internal_reference
        elif customer_reference:
            params["customer_reference"] = customer_reference
        else:
            return {
                'success': False,
                'error': 'Either internal_reference or customer_reference is required'
            }
        
        try:
            response = requests.get(url, params=params, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Transaction status: {data}")
            return {
                'success': True,
                'data': data
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to check status: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def validate_mobile_number(self, msisdn):
        """
        Validate a mobile money phone number
        
        Args:
            msisdn (str): Phone number in international format
        
        Returns:
            dict: Validation result with customer name if successful
        """
        url = f"{self.api_url}/payment-requests/validate"
        
        payload = {
            "msisdn": msisdn
        }
        
        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            data = response.json()
            return {
                'success': True,
                'data': data
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Validation failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_webhook_signature(self, webhook_url, timestamp, signature, params):
        """
        Verify that a webhook request came from Relworx
        
        Args:
            webhook_url (str): Your webhook URL (exactly as configured)
            timestamp (str): Timestamp from Relworx-Signature header
            signature (str): Signature from Relworx-Signature header
            params (dict): POST parameters (status, customer_reference, internal_reference)
        
        Returns:
            bool: True if signature is valid
        """
        # Build the signed data string
        signed_data = webhook_url + timestamp
        
        # Sort parameters by key and append
        sorted_params = sorted(params.items())
        for key, value in sorted_params:
            signed_data += str(key) + str(value)
        
        # Generate HMAC-SHA256 signature
        computed_signature = hmac.new(
            self.webhook_key.encode('utf-8'),
            signed_data.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        is_valid = hmac.compare_digest(computed_signature, signature)
        
        if not is_valid:
            logger.warning(f"Webhook signature mismatch! Expected: {computed_signature}, Got: {signature}")
        
        return is_valid
    
    def get_transaction_history(self):
        """
        Get transaction history for the last 30 days (max 1000 transactions)
        
        Returns:
            dict: List of transactions
        """
        url = f"{self.api_url}/payment-requests/transactions"
        
        params = {
            "account_no": self.account_no
        }
        
        try:
            response = requests.get(url, params=params, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            data = response.json()
            return {
                'success': True,
                'data': data
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get transaction history: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
