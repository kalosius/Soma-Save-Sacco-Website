import { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import api from '../services/api';
import Toast from './Toast';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

// Load PayPal SDK script once
let paypalScriptPromise = null;
function loadPayPalScript() {
  if (paypalScriptPromise) return paypalScriptPromise;
  if (window.paypal) return Promise.resolve();
  paypalScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&components=buttons,card-fields`;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
    document.head.appendChild(script);
  });
  return paypalScriptPromise;
}

export default function DepositModal({ isOpen, onClose, user, onSuccess }) {
  const { formatCurrency } = useSettings();
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Amount, 2: Payment Processing, 3: Verifying
  const [paymentMethod, setPaymentMethod] = useState('mobile_money'); // 'mobile_money' | 'paypal'
  const [txRef, setTxRef] = useState('');
  const [internalRef, setInternalRef] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [pollingInterval, setPollingInterval] = useState(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const paypalContainerRef = useRef(null);
  const paypalCardContainerRef = useRef(null);

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

    if (paymentMethod === 'mobile_money') {
      if (!phoneNumber) {
        setToast({
          show: true,
          message: 'Please enter your phone number',
          type: 'error'
        });
        return;
      }
      handleMobileMoneyDeposit();
    } else if (paymentMethod === 'paypal') {
      handlePayPalDeposit();
    }
  };

  const handleMobileMoneyDeposit = async () => {

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

  const handlePayPalDeposit = async () => {
    setLoading(true);
    setStep(3); // PayPal card step

    try {
      await loadPayPalScript();
      setPaypalReady(true);
    } catch (error) {
      console.error('PayPal SDK load error:', error);
      setToast({
        show: true,
        message: 'Failed to load PayPal. Please try again.',
        type: 'error'
      });
      setStep(1);
      setLoading(false);
    }
  };

  // Render PayPal buttons once SDK is loaded and container is ready
  useEffect(() => {
    if (step !== 3 || !paypalReady || !window.paypal) return;

    // Small delay to ensure DOM ref is attached
    const timer = setTimeout(() => {
      if (!paypalContainerRef.current) return;

      // Clear previous buttons
      paypalContainerRef.current.innerHTML = '';

      const depositAmount = parseFloat(amount).toFixed(2);

      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'pay',
        },
        createOrder: async () => {
          try {
            const response = await api.payments.paypalCreateOrder({
              amount: depositAmount,
              currency: 'USD',
            });
            if (response.success) {
              setTxRef(response.tx_ref);
              return response.order_id;
            } else {
              throw new Error(response.error || 'Failed to create order');
            }
          } catch (err) {
            setToast({ show: true, message: err.message, type: 'error' });
            throw err;
          }
        },
        onApprove: async (data) => {
          try {
            setStep(4); // Processing capture
            const response = await api.payments.paypalCaptureOrder({
              order_id: data.orderID,
              tx_ref: txRef,
            });
            if (response.success || response.status === 'COMPLETED') {
              setToast({
                show: true,
                message: `Deposit of $${depositAmount} successful! New balance: ${formatCurrency(response.new_balance)}`,
                type: 'success',
              });
              if (onSuccess) onSuccess(response);
              setTimeout(() => handleClose(), 2000);
            } else {
              setToast({ show: true, message: response.error || 'Payment failed', type: 'error' });
              setStep(1);
              setLoading(false);
            }
          } catch (error) {
            console.error('PayPal capture error:', error);
            setToast({ show: true, message: error.message || 'Payment failed', type: 'error' });
            setStep(1);
            setLoading(false);
          }
        },
        onCancel: () => {
          setToast({ show: true, message: 'Payment cancelled', type: 'info' });
          setStep(1);
          setLoading(false);
        },
        onError: (err) => {
          console.error('PayPal error:', err);
          setToast({ show: true, message: 'PayPal payment error. Please try again.', type: 'error' });
          setStep(1);
          setLoading(false);
        },
      }).render(paypalContainerRef.current);

      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [step, paypalReady]);

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
    setPaypalReady(false);
    setPaymentMethod('mobile_money');
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

          {/* Step 1: Amount & Payment Method */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mobile_money')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'mobile_money'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">smartphone</span>
                    <span className="text-sm font-semibold">Mobile Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'paypal'
                        ? 'border-[#0070ba] bg-[#0070ba]/10 text-[#0070ba]'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.603c-.564 0-1.04.408-1.13.964L7.076 21.337zM19.95 5.6c-.02.123-.04.248-.065.378-.87 4.456-3.855 6.348-7.93 6.348h-1.63a1.27 1.27 0 0 0-1.253 1.073l-1.158 7.345h2.116a.91.91 0 0 0 .9-.767l.037-.189.713-4.52.046-.249a.91.91 0 0 1 .9-.767h.567c3.668 0 6.539-1.49 7.38-5.803.351-1.802.17-3.305-.756-4.36a3.553 3.553 0 0 0-.867-.689z"/>
                    </svg>
                    <span className="text-sm font-semibold">PayPal / Card</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Deposit Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold">
                    {paymentMethod === 'paypal' ? 'USD' : 'UGX'}
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min={paymentMethod === 'paypal' ? '1' : '1000'}
                    step={paymentMethod === 'paypal' ? '0.01' : '1000'}
                    className="w-full pl-16 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-lg font-semibold"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {paymentMethod === 'paypal'
                    ? 'Pay via PayPal or debit/credit card (USD)'
                    : 'Minimum deposit: UGX 1,000 (approx. $0.27)'}
                </p>
              </div>

              {/* Mobile Money Phone Number */}
              {paymentMethod === 'mobile_money' && (
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
              )}

              {/* PayPal info hint */}
              {paymentMethod === 'paypal' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mt-0.5">credit_card</span>
                    <div>
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        Pay with Card via PayPal
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        You can pay with your debit or credit card through PayPal's secure checkout. No PayPal account required.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Amount Buttons */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Quick Select
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethod === 'paypal'
                    ? [5, 10, 20, 50, 100, 200].map((quickAmount) => (
                        <button
                          key={quickAmount}
                          type="button"
                          onClick={() => setAmount(quickAmount.toString())}
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-[#0070ba] hover:text-white dark:hover:bg-[#0070ba] rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          ${quickAmount}
                        </button>
                      ))
                    : [5000, 10000, 20000, 50000, 100000, 200000].map((quickAmount) => (
                        <button
                          key={quickAmount}
                          type="button"
                          onClick={() => setAmount(quickAmount.toString())}
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-gray-900 dark:hover:bg-primary rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          {formatCurrency(quickAmount)}
                        </button>
                      ))
                  }
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-4 font-bold rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 ${
                  paymentMethod === 'paypal'
                    ? 'bg-[#0070ba] hover:bg-[#005ea6] text-white'
                    : 'bg-primary hover:opacity-90 text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined">
                  {paymentMethod === 'paypal' ? 'credit_card' : 'payment'}
                </span>
                {paymentMethod === 'paypal' ? 'Pay with PayPal / Card' : 'Continue to Payment'}
              </button>
            </form>
          )}

          {/* Step 2: Mobile Money Processing */}
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

          {/* Step 3: PayPal Buttons */}
          {step === 3 && (
            <div className="p-6 space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Complete Payment — ${parseFloat(amount || 0).toFixed(2)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Choose PayPal or pay directly with your card
                </p>
              </div>

              {loading && !paypalReady && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <span className="material-symbols-outlined text-4xl text-[#0070ba] animate-spin">
                    progress_activity
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading payment options...</p>
                </div>
              )}

              <div ref={paypalContainerRef} className="min-h-[150px]" />

              <button
                onClick={() => { setStep(1); setLoading(false); setPaypalReady(false); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline mt-2"
              >
                ← Back to payment options
              </button>
            </div>
          )}

          {/* Step 4: PayPal Processing */}
          {step === 4 && (
            <div className="p-6 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#0070ba]/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-[#0070ba] animate-spin">
                  progress_activity
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Processing Payment
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Completing your PayPal payment...
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600">
                Please wait while we confirm your deposit.
              </p>
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
