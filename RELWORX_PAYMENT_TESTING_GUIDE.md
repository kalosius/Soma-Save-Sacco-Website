# Relworx Payment Testing Guide

## ✅ Fixes Applied

### Backend Fixes
1. **API Endpoint URLs Fixed** - Updated to match Relworx API v2 specification:
   - `/payment-requests/mobile-money` (was `/mobile-money/request-payment`)
   - `/payment-requests/status` (was `/mobile-money/check-request-status`)
   - `/payment-requests/validate` (was `/mobile-money/validate`)

2. **Error Response Format** - Added `success` flag to all error responses for consistent frontend handling

3. **Minimum Amount Updated** - Changed from UGX 500 to UGX 1,000 to match typical mobile money requirements

4. **Phone Number Validation** - Already correctly formats numbers with +256 country code for Uganda

### Frontend Fixes
1. **Better Error Messages** - Added specific error handling for:
   - Authentication errors
   - Phone number format errors
   - Amount validation errors
   - Network errors

2. **Updated Minimum Amount** - Changed UI to reflect UGX 1,000 minimum

3. **Improved User Feedback** - Enhanced error messages to guide users

## 🧪 Testing Steps

### 1. Backend Configuration Check

Run the test script to verify configuration:

```powershell
cd backend
C:/Users/user/Desktop/somasavewebsite/backend/venv/Scripts/python.exe test_relworx_integration.py
```

**Expected Results:**
- ✅ API Key configured
- ✅ Account Number configured (RELEAE2072EE4)
- ✅ Webhook Key configured
- ✅ Webhook signature verification working

### 2. Test Payment Flow (Local Development)

#### Start Backend Server:
```powershell
cd backend
C:/Users/user/Desktop/somasavewebsite/backend/venv/Scripts/python.exe manage.py runserver
```

#### Start Frontend Server:
```powershell
npm run dev
```

#### Test Deposit:
1. Open http://localhost:5173 in your browser
2. Log in with your credentials
3. Click "Make Deposit" button
4. Enter amount: **5000** (UGX 5,000)
5. Enter phone number: 
   - Format 1: `+256700000000` (with country code)
   - Format 2: `0700000000` (will auto-add +256)
6. Click "Continue to Payment"

**Expected Behavior:**
- Modal shows "Payment Request Sent"
- You should see a spinning loader
- Message: "Check your phone for a Mobile Money payment prompt"
- Transaction reference is displayed
- Frontend automatically polls for status every 3 seconds

### 3. Mobile Money Payment Completion

On your phone (the number you entered):
1. You should receive a Mobile Money payment prompt
2. Enter your PIN to approve
3. Wait for confirmation SMS

**Frontend Should:**
- Keep polling status
- When payment succeeds:
  - Show success toast
  - Display new balance
  - Close modal after 2 seconds

### 4. Check Database

Verify the deposit was recorded:

```powershell
cd backend
C:/Users/user/Desktop/somasavewebsite/backend/venv/Scripts/python.exe manage.py shell
```

```python
from api.models import Deposit, Account
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.first()  # Or get your specific user

# Check deposits
deposits = Deposit.objects.filter(user=user).order_by('-created_at')
for d in deposits[:5]:
    print(f"{d.tx_ref}: {d.amount} UGX - Status: {d.status}")

# Check balance
account = Account.objects.get(user=user, account_type='SAVINGS')
print(f"Account Balance: {account.balance} UGX")
```

### 5. Production Testing (Railway)

#### Check Environment Variables:
Go to Railway Dashboard → Your Project → Variables

Ensure these are set:
```
RELWORX_API_KEY=55cbd4454b75ef.4MsHHl_YCvRQnCYdF0ybmA
RELWORX_ACCOUNT_NO=RELEAE2072EE4
RELWORX_WEBHOOK_KEY=191dc8aec53073d24fbd357368
```

#### Configure Webhook:
1. Log in to https://payments.relworx.com
2. Go to Settings → Webhooks
3. Set webhook URL to:
   ```
   https://soma-save-sacco-website-production.up.railway.app/api/payments/relworx-webhook/
   ```

#### Test on Production:
1. Visit your deployed site
2. Log in
3. Make a test deposit (minimum 1,000 UGX)
4. Complete payment on phone
5. Verify balance updates

## 🔍 Troubleshooting

### Issue: "403 Forbidden" Error

**Cause:** API credentials may be incorrect or expired

**Solution:**
1. Verify API key in Relworx dashboard
2. Check if your account is active
3. Ensure you're using the correct account number

### Issue: Payment Request Not Sent

**Possible Causes:**
1. Phone number format incorrect
2. Amount below minimum (1,000 UGX)
3. Network connectivity issue

**Check:**
```powershell
# View backend logs
cd backend
C:/Users/user/Desktop/somasavewebsite/backend/venv/Scripts/python.exe manage.py runserver
# Watch console for errors
```

### Issue: Status Polling Not Working

**Solution:**
1. Check browser console for errors (F12)
2. Verify the transaction reference was returned
3. Ensure backend is running and accessible

### Issue: Balance Not Updating

**Possible Causes:**
1. Payment hasn't been completed yet
2. Webhook not configured (for production)
3. Database issue

**Check Status Manually:**
```python
# In Django shell
from api.models import Deposit

# Find your deposit
deposit = Deposit.objects.filter(status='PENDING').last()
print(f"Status: {deposit.status}")
print(f"TX Ref: {deposit.tx_ref}")

# Manually verify with Relworx
from api.relworx import RelworxPaymentGateway
gateway = RelworxPaymentGateway()
result = gateway.check_request_status(customer_reference=deposit.tx_ref)
print(result)
```

## 📊 Expected API Responses

### Successful Payment Initiation:
```json
{
  "success": true,
  "tx_ref": "SACCO_1_A1B2C3D4E5F6",
  "internal_reference": "RPR12345678",
  "amount": 5000.0,
  "currency": "UGX",
  "phone_number": "+256700000000",
  "message": "Payment request sent. Please check your phone to complete payment.",
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Payment Status (Pending):
```json
{
  "message": "Payment is still being processed",
  "tx_ref": "SACCO_1_A1B2C3D4E5F6",
  "status": "PENDING"
}
```

### Payment Status (Success):
```json
{
  "message": "Deposit successful",
  "tx_ref": "SACCO_1_A1B2C3D4E5F6",
  "amount": 5000.0,
  "new_balance": 15000.0,
  "status": "COMPLETED",
  "provider_transaction_id": "MTN123456789"
}
```

### Payment Status (Failed):
```json
{
  "error": "Payment failed or was cancelled",
  "tx_ref": "SACCO_1_A1B2C3D4E5F6",
  "status": "FAILED",
  "message": "User cancelled transaction"
}
```

## 🎯 Success Criteria

Your payment integration is working correctly when:

1. ✅ User can initiate deposit from frontend
2. ✅ Payment prompt appears on user's phone
3. ✅ User completes payment on phone
4. ✅ Frontend automatically detects completion
5. ✅ Account balance updates correctly
6. ✅ Deposit record saved with status 'COMPLETED'
7. ✅ Success message shown to user
8. ✅ Transaction appears in user's transaction history

## 📝 Notes

- **Test Accounts:** If you have test API keys from Relworx, use them for testing
- **Real Money:** The current configuration uses production credentials - be careful with testing amounts
- **Phone Numbers:** Only use phone numbers you control for testing
- **Currency:** Currently configured for UGX (Uganda). Other currencies (KES, TZS, RWF) are supported
- **Polling:** Frontend polls every 3 seconds for up to ~30 seconds (can be adjusted)

## 🚀 Next Steps

After successful testing:

1. **Enable Webhooks:** Configure webhook URL in Relworx dashboard for instant updates
2. **Set Transaction Limits:** Configure min/max amounts in backend settings
3. **Add Notifications:** Send SMS/email confirmations for deposits
4. **Monitor Transactions:** Check Relworx dashboard regularly
5. **Handle Failed Payments:** Add UI for users to retry failed payments

## 📞 Support

If you encounter persistent issues:

1. Check Relworx API documentation: https://docs.relworx.com
2. Contact Relworx support with your account number
3. Review backend logs for detailed error messages
4. Check network connectivity between your server and Relworx API

## 🔐 Security Notes

- ✅ Webhook signature verification implemented
- ✅ Authentication required for all payment endpoints
- ✅ Phone numbers validated and formatted correctly
- ✅ Amount limits enforced
- ⚠️ Keep API keys secure (never commit to git)
- ⚠️ Use environment variables in production
