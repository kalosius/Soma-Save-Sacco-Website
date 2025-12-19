import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import api from '../services/api';
import Toast from './Toast';

export default function DepositModal({ isOpen, onClose, user, onSuccess }) {
  const { formatCurrency } = useSettings();
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Amount, 2: Payment Processing
  const [txRef, setTxRef] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [paymentWindow, setPaymentWindow] = useState(null);

  useEffect(() => {
    if (user?.phone_number) {
      setPhoneNumber(user.phone_number);
    }
  }, [user]);

  const handleVerifyPayment = async (status, transactionId) => {
    try {
      const response = await api.payments.verifyDeposit({
        tx_ref: txRef,
        status: status,
        transaction_id: transactionId
      });

      if (response.status === 'COMPLETED') {
        setToast({
          show: true,
          message: `Deposit of ${formatCurrency(response.amount)} successful! New balance: ${formatCurrency(response.new_balance)}`,
          type: 'success'
        });
        
        // Notify parent component
        if (onSuccess) {
          onSuccess(response);
        }

        // Close modal after 2 seconds
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setToast({
          show: true,
          message: 'Payment failed or was cancelled',
          type: 'error'
        });
        setStep(1);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setToast({
        show: true,
        message: error.message || 'Error verifying payment',
        type: 'error'
      });
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // Listen for payment completion messages
  useEffect(() => {
    const handleMessage = async (event) => {
      // Verify origin for security
      if (event.origin !== 'https://payments.relworx.com') return;

      const { status, transaction_id, tx_ref: receivedTxRef } = event.data;

      if (receivedTxRef === txRef) {
        // Close payment window
        if (paymentWindow && !paymentWindow.closed) {
          paymentWindow.close();
        }

        // Verify payment with backend
        await handleVerifyPayment(status, transaction_id);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [txRef, paymentWindow]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setToast({
        show: true,
        message: 'Please enter a valid amount',
        type: 'error'
      });
      return;
    }

    if (!phoneNumber) {
      setToast({
        show: true,
        message: 'Please enter your phone number',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    setStep(2);

    try {
      // Initiate deposit
      const response = await api.payments.initiateDeposit({
        amount: parseFloat(amount),
        phone_number: phoneNumber
      });

      setTxRef(response.tx_ref);

      // Build Relworx payment URL
      const paymentUrl = new URL('https://payments.relworx.com/pay');
      paymentUrl.searchParams.append('amount', response.amount);
      paymentUrl.searchParams.append('phone', response.phone_number);
      paymentUrl.searchParams.append('tx_ref', response.tx_ref);
      paymentUrl.searchParams.append('customer_name', response.user.name);
      paymentUrl.searchParams.append('customer_email', response.user.email);
      paymentUrl.searchParams.append('description', 'SomaSave SACCO Deposit');
      paymentUrl.searchParams.append('callback_url', window.location.origin + '/member-portal');

      // Open payment in new window
      const width = 500;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const popup = window.open(
        paymentUrl.toString(),
        'Relworx Payment',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      setPaymentWindow(popup);

      if (!popup) {
        setToast({
          show: true,
          message: 'Please allow pop-ups to complete payment',
          type: 'error'
        });
        setStep(1);
        setLoading(false);
        return;
      }

      // Monitor if popup is closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setLoading(false);
          setStep(1);
          setToast({
            show: true,
            message: 'Payment window was closed',
            type: 'info'
          });
        }
      }, 1000);

    } catch (error) {
      console.error('Deposit error:', error);
      
      let errorMessage = 'Failed to initiate deposit';
      
      // Check if it's an authentication error
      if (error.message && error.message.includes('401')) {
        errorMessage = 'Please log in again to make a deposit';
      } else if (error.message && error.message.includes('authenticated')) {
        errorMessage = 'Authentication required. Please log in again';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setToast({
        show: true,
        message: errorMessage,
        type: 'error'
      });
      setStep(1);
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close();
    }
    setAmount('');
    setStep(1);
    setTxRef('');
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full animate-fadeInUp">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Make Deposit</h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Step 1: Amount Entry */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Deposit Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold">
                    UGX
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1000"
                    step="1000"
                    className="w-full pl-16 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-lg font-semibold"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Minimum deposit: UGX 1,000
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Mobile Money Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., 256700000000"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Payment will be processed via Mobile Money
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Quick Select
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[5000, 10000, 20000, 50000, 100000, 200000].map((quickAmount) => (
                    <button
                      key={quickAmount}
                      type="button"
                      onClick={() => setAmount(quickAmount.toString())}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-gray-900 dark:hover:bg-primary rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      {formatCurrency(quickAmount)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-primary hover:opacity-90 text-gray-900 font-bold rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">payment</span>
                Continue to Payment
              </button>
            </form>
          )}

          {/* Step 2: Payment Processing */}
          {step === 2 && (
            <div className="p-6 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">
                  progress_activity
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Processing Payment
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Complete the payment in the popup window
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Transaction Reference: {txRef}
              </p>
              <button
                onClick={handleClose}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
              >
                Cancel Payment
              </button>
            </div>
          )}
        </div>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: '' })}
        />
      )}
    </>
  );
}
