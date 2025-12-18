import { useState, useEffect } from 'react';
import api from '../services/api';

export default function MySavings({ user, accounts }) {
  const [loading, setLoading] = useState(true);
  const [savingsData, setSavingsData] = useState(null);

  useEffect(() => {
    const fetchSavingsData = async () => {
      try {
        setLoading(true);
        const data = await api.auth.getDashboardStats();
        setSavingsData(data);
      } catch (err) {
        console.error('Failed to fetch savings data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSavingsData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  const totalSavings = savingsData?.stats?.total_savings || 0;
  const savingsGrowth = savingsData?.stats?.savings_growth || '0.0%';

  return (
    <div className="space-y-4">
      {/* Savings Overview - Compact */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">My Savings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="p-5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/50 hover-lift">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-primary text-2xl">account_balance_wallet</span>
              <span className="text-xs font-bold text-primary bg-white dark:bg-gray-900 px-2 py-1 rounded-full">
                {savingsGrowth}
              </span>
            </div>
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Total Balance</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              UGX {parseFloat(totalSavings).toLocaleString()}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border-2 border-green-500/50 hover-lift">
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-green-600 text-2xl">trending_up</span>
            </div>
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Growth Rate</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{savingsGrowth}</p>
          </div>
        </div>
      </div>

      {/* Savings Accounts - Compact */}
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Your Accounts</h3>
        
        {accounts && accounts.length > 0 ? (
          <div className="space-y-3">{accounts.map((account, index) => (
              <div 
                key={index}
                className="p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 hover:border-primary transition-all cursor-pointer hover-lift"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary">
                      <span className="material-symbols-outlined text-lg">savings</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {account.type || 'Savings Account'}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        #{account.account_number || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      UGX {parseFloat(account.balance || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Balance</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
            <span className="material-symbols-outlined text-5xl text-gray-400 dark:text-gray-600 mb-3">savings</span>
            <p className="text-gray-600 dark:text-gray-400 mb-4">No savings accounts yet</p>
            <button className="px-5 py-2.5 rounded-full bg-primary text-gray-900 text-sm font-bold hover:opacity-90 transition-all">
              Open Savings Account
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions - Compact Grid */}
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all">
            <span className="material-symbols-outlined text-primary text-2xl">add_circle</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">Deposit</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all">
            <span className="material-symbols-outlined text-primary text-2xl">receipt_long</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">Statements</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all">
            <span className="material-symbols-outlined text-primary text-2xl">download</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
