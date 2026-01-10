import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import api from '../services/api';
import Toast from './Toast';

export default function DepositModal({ isOpen, onClose, user, onSuccess }) {
  const { formatCurrency } = useSettings();
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Amount, 2: Payment Processing, 3: Verifying
  const [txRef, setTxRef] = useState('');
  const [internalRef, setInternalRef] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    if (user?.phone_number) {
      setPhoneNumber(user.phone_number);
    }
  }, [user]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const checkPaymentStatus = async (txReference) => {
    try {
      const response = await api.payments.verifyDeposit({
        tx_ref: txReference
      });

      if (response.status === 'COMPLETED') {
        // Clear polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }

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
      } else if (response.status === 'FAILED') {
        // Clear polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }

        setToast({
          show: true,
          message: 'Payment failed or was cancelled',
          type: 'error'
        });
        setStep(1);
        setLoading(false);
      }
      // If still PENDING, keep polling
    } catch (error) {
      console.error('Status check error:', error);
      // Don't show error for status checks, just keep polling
    }
  };

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
      // Initiate deposit - backend will call Relworx API
      const response = await api.payments.initiateDeposit({
        amount: parseFloat(amount),
        phone_number: phoneNumber
      });

      if (response.success) {
        setTxRef(response.tx_ref);
        setInternalRef(response.internal_reference);

        setToast({
          show: true,
          message: response.message || 'Payment request sent! Please check your phone to complete payment.',
          type: 'info'
        });

        // Start polling for payment status every 3 seconds
        const interval = setInterval(() => {
          checkPaymentStatus(response.tx_ref);
        }, 3000);
        
        setPollingInterval(interval);

        // Also check immediately after 2 seconds
        setTimeout(() => {
          checkPaymentStatus(response.tx_ref);
        }, 2000);

      } else {
        setToast({
          show: true,
          message: response.error || 'Failed to initiate payment',
          type: 'error'
        });
        setStep(1);
        setLoading(false);
      }

    } catch (error) {
      console.error('Deposit error:', error);
      
      let errorMessage = 'Failed to initiate deposit. Please try again.';
      
      // Parse error messages
      if (error.message) {
        if (error.message.includes('401') || error.message.includes('authenticated')) {
          errorMessage = 'Please log in again to make a deposit';
        } else if (error.message.includes('phone') || error.message.includes('Phone')) {
          errorMessage = 'Invalid phone number. Please use format: +256XXXXXXXXX or 0XXXXXXXXX';
        } else if (error.message.includes('amount') || error.message.includes('Amount')) {
          errorMessage = error.message;
        } else if (error.message.includes('network') || error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
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
    // Clear any active polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
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
                  Minimum deposit: UGX 1,000 (approx. $0.27)
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
                Payment Request Sent
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check your phone for a Mobile Money payment prompt
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold mb-2">
                  📱 Complete the payment on your phone
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  You should receive a prompt on {phoneNumber}
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Transaction Reference: {txRef}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600">
                Waiting for payment confirmation...
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
