import { useState, useEffect } from "react";
import { Calendar, Filter, Download, Printer, FileText, ArrowRight, Wallet, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

export default function CreditsDebitsReport() {
    const [language, setLanguage] = useState("en");
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [showLedger, setShowLedger] = useState(false);
    const [ledgerData, setLedgerData] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        accountId: '',
        accountType: '',
        transactionType: '',
        direction: '',
        source: '',
        status: ''
    });

    const [accounts, setAccounts] = useState([]);

    // Fetch accounts for dropdown
    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/qarzaRoutes/getAllQarzaAccount', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setAccounts(data.accounts || []);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const response = await fetch(`http://localhost:5001/api/qarzaRoutes/credits-debits/report?${queryParams}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setReportData(data.data);
            } else {
                showError(data.msg || 'Failed to fetch report');
            }
        } catch (error) {
            showError('Failed to fetch report');
        } finally {
            setLoading(false);
        }
    };

    const fetchLedger = async (accountId) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);

            const response = await fetch(`http://localhost:5001/api/qarzaRoutes/credits-debits/ledger/${accountId}?${queryParams}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setLedgerData(data.data);
                setShowLedger(true);
            } else {
                showError(data.msg || 'Failed to fetch ledger');
            }
        } catch (error) {
            showError('Failed to fetch ledger');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (type) => {
        showSuccess(`Exporting as ${type}...`);
        // Implement export logic
    };

    const handlePrint = () => {
        window.print();
    };

    const getTagBadge = (tag) => {
        const tags = {
            cleared: { bg: 'bg-green-100', text: 'text-green-800', icon: '🟢', label: 'Cleared' },
            partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🟡', label: 'Partial' },
            overdue: { bg: 'bg-red-100', text: 'text-red-800', icon: '🔴', label: 'Overdue' },
            advance: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🔵', label: 'Advance' }
        };
        const tagConfig = tags[tag] || tags.cleared;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${tagConfig.bg} ${tagConfig.text}`}>
                {tagConfig.icon} {tagConfig.label}
            </span>
        );
    };

    if (showLedger && ledgerData) {
        return (
            <div className="h-screen flex flex-col bg-gray-50">
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setShowLedger(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Account Ledger</h1>
                                <p className="text-sm text-gray-500">{ledgerData.account.name} - {ledgerData.account.type}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <Printer className="w-4 h-4" />
                                Print
                            </button>
                            <button onClick={() => handleExport('PDF')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <FileText className="w-4 h-4" />
                                PDF
                            </button>
                            <button onClick={() => handleExport('Excel')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <Download className="w-4 h-4" />
                                Excel
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-6">
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Account Name</p>
                                <p className="font-semibold text-gray-900">{ledgerData.account.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Account Type</p>
                                <p className="font-semibold text-gray-900 capitalize">{ledgerData.account.type}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-semibold text-gray-900">{ledgerData.account.phoneNo || '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Current Balance</p>
                                <p className={`font-bold ${ledgerData.account.currentBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    Rs {Math.abs(ledgerData.account.currentBalance).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Source</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Direction</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Debit</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Credit</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {ledgerData.ledger.map((entry, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {new Date(entry.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{entry.description}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {entry.source === 'pos' ? `POS Order: ${entry.orderNumber}` : 
                                             entry.source === 'purchase' ? `Purchase: ${entry.orderNumber}` : 
                                             entry.source}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                entry.transactionType === 'cash' ? 'bg-green-100 text-green-800' :
                                                entry.transactionType === 'credit' ? 'bg-blue-100 text-blue-800' :
                                                'bg-purple-100 text-purple-800'
                                            }`}>
                                                {entry.transactionType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                entry.direction === 'incoming' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {entry.direction}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-red-600">
                                            {entry.debitAmount > 0 ? `Rs ${entry.debitAmount.toLocaleString()}` : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                                            {entry.creditAmount > 0 ? `Rs ${entry.creditAmount.toLocaleString()}` : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">
                                            Rs {entry.runningBalance.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {ledgerData.ledger.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                            No transactions found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Credits & Debits Report</h1>
                        <p className="text-sm text-gray-500">Track all credit account transactions and balances</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <Printer className="w-4 h-4" />
                            Print
                        </button>
                        <button onClick={() => handleExport('PDF')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <FileText className="w-4 h-4" />
                            PDF
                        </button>
                        <button onClick={() => handleExport('Excel')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <Download className="w-4 h-4" />
                            Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filters</span>
                </div>
                <div className="grid grid-cols-7 gap-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Account</label>
                        <select
                            value={filters.accountId}
                            onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Accounts</option>
                            {accounts.map(account => (
                                <option key={account._id} value={account._id}>{account.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Account Type</label>
                        <select
                            value={filters.accountType}
                            onChange={(e) => setFilters({ ...filters, accountType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Types</option>
                            <option value="personal">Personal</option>
                            <option value="business">Business</option>
                            <option value="others">Others</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Transaction Type</label>
                        <select
                            value={filters.transactionType}
                            onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Types</option>
                            <option value="cash">Cash</option>
                            <option value="credit">Credit</option>
                            <option value="hybrid">Hybrid</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Direction</label>
                        <select
                            value={filters.direction}
                            onChange={(e) => setFilters({ ...filters, direction: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Directions</option>
                            <option value="incoming">Incoming</option>
                            <option value="outgoing">Outgoing</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Source</label>
                        <select
                            value={filters.source}
                            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Sources</option>
                            <option value="pos">POS Order</option>
                            <option value="purchase">Purchase</option>
                            <option value="manual">Manual</option>
                        </select>
                    </div>
                </div>
                <button
                    onClick={fetchReport}
                    disabled={loading}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                    {loading ? 'Loading...' : 'Apply Filters'}
                </button>
            </div>

            {/* Summary Bar */}
            {reportData && (
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="grid grid-cols-7 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-xs text-blue-600 font-medium">Total Accounts</p>
                            <p className="text-2xl font-bold text-blue-900">{reportData.summary.totalAccounts}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-xs text-green-600 font-medium">Total Credit</p>
                            <p className="text-2xl font-bold text-green-900">Rs {reportData.summary.totalCreditAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4">
                            <p className="text-xs text-red-600 font-medium">Total Debit</p>
                            <p className="text-2xl font-bold text-red-900">Rs {reportData.summary.totalDebitAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                            <p className="text-xs text-purple-600 font-medium">Balance Due</p>
                            <p className="text-2xl font-bold text-purple-900">Rs {reportData.summary.totalBalanceDue.toLocaleString()}</p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-4">
                            <p className="text-xs text-yellow-600 font-medium">Cash Transactions</p>
                            <p className="text-2xl font-bold text-yellow-900">Rs {reportData.summary.totalCashTransactions.toLocaleString()}</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-4">
                            <p className="text-xs text-indigo-600 font-medium">Credit Transactions</p>
                            <p className="text-2xl font-bold text-indigo-900">Rs {reportData.summary.totalCreditTransactions.toLocaleString()}</p>
                        </div>
                        <div className="bg-pink-50 rounded-lg p-4">
                            <p className="text-xs text-pink-600 font-medium">Hybrid Transactions</p>
                            <p className="text-2xl font-bold text-pink-900">Rs {reportData.summary.totalHybridTransactions.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Account Table */}
            <div className="flex-1 overflow-auto p-6">
                {reportData ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Account Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Debit</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Credit</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Cash Amount</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Credit Amount</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Hybrid Amount</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Current Balance</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {reportData.accounts.map((accountData, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{accountData.account.name}</p>
                                                <p className="text-xs text-gray-500">{accountData.account.phoneNo || '—'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 capitalize">{accountData.account.type}</td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-red-600">
                                            Rs {accountData.totalDebit.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                                            Rs {accountData.totalCredit.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right text-gray-900">
                                            Rs {accountData.cashAmount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right text-gray-900">
                                            Rs {accountData.creditAmount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right text-gray-900">
                                            Rs {accountData.hybridAmount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">
                                            Rs {accountData.currentBalance.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getTagBadge(accountData.tag)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => fetchLedger(accountData.account._id)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-1"
                                            >
                                                View Ledger <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {reportData.accounts.length === 0 && (
                                    <tr>
                                        <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                                            No accounts found matching the filters
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Data</h3>
                        <p className="text-gray-500 mb-4">Apply filters to generate the credits & debits report</p>
                        <button
                            onClick={fetchReport}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                            Generate Report
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
