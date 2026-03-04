"""
PayPal Payment Gateway Integration
Uses PayPal REST API v2 for creating and capturing orders.
All credentials are loaded from environment variables.
"""
import os
import requests
import logging
import base64

logger = logging.getLogger(__name__)


class PayPalGateway:
    """PayPal REST API v2 client for order creation and capture."""

    def __init__(self):
        self.client_id = os.getenv('PAYPAL_CLIENT_ID')
        self.client_secret = os.getenv('PAYPAL_CLIENT_SECRET')
        self.mode = os.getenv('PAYPAL_MODE', 'sandbox')

        if self.mode == 'live':
            self.base_url = 'https://api-m.paypal.com'
        else:
            self.base_url = 'https://api-m.sandbox.paypal.com'

        if not self.client_id or not self.client_secret:
            logger.error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET env vars.')

    def _get_access_token(self):
        """Get OAuth 2.0 access token from PayPal."""
        url = f'{self.base_url}/v1/oauth2/token'
        credentials = base64.b64encode(
            f'{self.client_id}:{self.client_secret}'.encode()
        ).decode()

        headers = {
            'Authorization': f'Basic {credentials}',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        data = {'grant_type': 'client_credentials'}

        try:
            response = requests.post(url, headers=headers, data=data, timeout=30)
            response.raise_for_status()
            return response.json().get('access_token')
        except requests.RequestException as e:
            logger.error(f'Failed to get PayPal access token: {e}')
            return None

    def create_order(self, amount, currency='USD', description='SomaSave SACCO Deposit', reference_id=None):
        """
        Create a PayPal order for card payment.
        
        Args:
            amount: Amount in the specified currency (float/str)
            currency: Currency code (default USD)
            description: Order description
            reference_id: Internal reference for the order
            
        Returns:
            dict with 'success', 'order_id', 'approval_url' keys
        """
        access_token = self._get_access_token()
        if not access_token:
            return {'success': False, 'error': 'Failed to authenticate with PayPal'}

        url = f'{self.base_url}/v2/checkout/orders'
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }

        order_data = {
            'intent': 'CAPTURE',
            'purchase_units': [
                {
                    'amount': {
                        'currency_code': currency,
                        'value': f'{float(amount):.2f}',
                    },
                    'description': description,
                }
            ],
        }

        if reference_id:
            order_data['purchase_units'][0]['reference_id'] = reference_id

        try:
            response = requests.post(url, headers=headers, json=order_data, timeout=30)
            response_data = response.json()

            if response.status_code in (200, 201):
                order_id = response_data.get('id')
                # Find approval link
                approval_url = None
                for link in response_data.get('links', []):
                    if link.get('rel') == 'approve':
                        approval_url = link.get('href')
                        break

                logger.info(f'PayPal order created: {order_id}')
                return {
                    'success': True,
                    'order_id': order_id,
                    'approval_url': approval_url,
                    'status': response_data.get('status'),
                }
            else:
                error_msg = response_data.get('message', 'Unknown PayPal error')
                details = response_data.get('details', [])
                logger.error(f'PayPal create order failed: {error_msg}, details: {details}')
                return {'success': False, 'error': error_msg, 'details': details}

        except requests.RequestException as e:
            logger.error(f'PayPal create order request failed: {e}')
            return {'success': False, 'error': str(e)}

    def capture_order(self, order_id):
        """
        Capture a PayPal order after approval.
        
        Args:
            order_id: The PayPal order ID to capture

        Returns:
            dict with 'success', capture details
        """
        access_token = self._get_access_token()
        if not access_token:
            return {'success': False, 'error': 'Failed to authenticate with PayPal'}

        url = f'{self.base_url}/v2/checkout/orders/{order_id}/capture'
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }

        try:
            response = requests.post(url, headers=headers, json={}, timeout=30)
            response_data = response.json()

            if response.status_code in (200, 201):
                capture_status = response_data.get('status')
                capture_id = None
                amount_captured = None

                # Extract capture details from purchase units
                for unit in response_data.get('purchase_units', []):
                    for capture in unit.get('payments', {}).get('captures', []):
                        capture_id = capture.get('id')
                        amount_captured = capture.get('amount', {}).get('value')
                        break

                logger.info(f'PayPal order captured: {order_id}, capture_id: {capture_id}, status: {capture_status}')
                return {
                    'success': True,
                    'order_id': order_id,
                    'capture_id': capture_id,
                    'status': capture_status,
                    'amount': amount_captured,
                    'payer': response_data.get('payer', {}),
                }
            else:
                error_msg = response_data.get('message', 'Capture failed')
                logger.error(f'PayPal capture failed: {error_msg}')
                return {'success': False, 'error': error_msg}

        except requests.RequestException as e:
            logger.error(f'PayPal capture request failed: {e}')
            return {'success': False, 'error': str(e)}

    def get_order_details(self, order_id):
        """Get details of an existing PayPal order."""
        access_token = self._get_access_token()
        if not access_token:
            return {'success': False, 'error': 'Failed to authenticate with PayPal'}

        url = f'{self.base_url}/v2/checkout/orders/{order_id}'
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }

        try:
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code == 200:
                return {'success': True, 'data': response.json()}
            else:
                return {'success': False, 'error': response.json().get('message', 'Failed to get order')}
        except requests.RequestException as e:
            logger.error(f'PayPal get order failed: {e}')
            return {'success': False, 'error': str(e)}

    def verify_webhook_signature(self, headers_dict, body, webhook_id=None):
        """
        Verify a PayPal webhook event signature.
        
        Args:
            headers_dict: Dict of HTTP headers from the webhook request
            body: Raw request body (bytes or str)
            webhook_id: The PayPal webhook ID (from env if not provided)
        
        Returns:
            bool indicating if the signature is valid
        """
        access_token = self._get_access_token()
        if not access_token:
            return False

        wh_id = webhook_id or os.getenv('PAYPAL_WEBHOOK_ID', '')
        if not wh_id:
            logger.warning('PAYPAL_WEBHOOK_ID not set — skipping signature verification')
            # In sandbox mode, allow without verification
            return self.mode == 'sandbox'

        url = f'{self.base_url}/v1/notifications/verify-webhook-signature'

        verify_data = {
            'auth_algo': headers_dict.get('PAYPAL-AUTH-ALGO', ''),
            'cert_url': headers_dict.get('PAYPAL-CERT-URL', ''),
            'transmission_id': headers_dict.get('PAYPAL-TRANSMISSION-ID', ''),
            'transmission_sig': headers_dict.get('PAYPAL-TRANSMISSION-SIG', ''),
            'transmission_time': headers_dict.get('PAYPAL-TRANSMISSION-TIME', ''),
            'webhook_id': wh_id,
            'webhook_event': body if isinstance(body, dict) else {},
        }

        try:
            response = requests.post(
                url,
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json',
                },
                json=verify_data,
                timeout=30,
            )
            if response.status_code == 200:
                verification_status = response.json().get('verification_status')
                return verification_status == 'SUCCESS'
            else:
                logger.error(f'Webhook signature verification failed: {response.text}')
                return False
        except requests.RequestException as e:
            logger.error(f'Webhook signature verification request failed: {e}')
            return False
