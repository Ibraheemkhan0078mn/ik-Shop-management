import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Login from "../modules/auth/pages/Login.jsx";
import Signup from "../modules/auth/pages/Signup.jsx";
import Profile from "../modules/auth/pages/Profile.jsx";
import UserManagement from "../modules/auth/pages/UserManagement.jsx";
import ProtectedRoute from "../shared/components/ProtectedRoute.jsx";
import Products from "../modules/productsModule/pages/Products.jsx";
import Analytics from "../modules/dashbaord/pages/Analytics.jsx";
import Dashboard from "../modules/dashbaord/pages/Dashboard.jsx";
import Generals from "../modules/setting/pages/Generals.jsx";
import WastagePage from "../modules/wastage/pages/WastagePage.jsx";
import ProductPurchase from "../modules/productPurchases/pages/ProductPurchase.jsx";
import SupplierPage from "../modules/suppliers/pages/SupplierPage.jsx";
import PurchaseReturnPage from "../modules/purchaseReturn/pages/PurchaseReturnPage.jsx";
import ViewProductPage from "../modules/productsModule/pages/Products.jsx";
import QuickActions from "../modules/dashbaord/pages/QuickActions.jsx";
import QarzaAccounts from "../modules/qarza/pages/QarzaAccounts.jsx";
import EachQarzaAccountRecords from "../modules/qarza/pages/EachQarzaAccountRecords.jsx";
import Inventory from "../modules/inventory/pages/Inventory.jsx";
import AllExpenses from "../modules/expense/pages/AllExpense.jsx";
import PosPage from "../modules/POSmodule/pages/PosPage.jsx";
import ProductCategoriesPage from "../modules/productsModule/pages/ProductCategoriesPage.jsx";
import ProductSubCategoriesPage from "../modules/productsModule/pages/ProductSubCategoriesPage.jsx";
import ReportsPage from "../modules/reports/pages/ReportsPage.jsx";
import MainBusinessReport from "../modules/reports/pages/MainBusinessReport.jsx";
import ProfitLossReport from "../modules/reports/pages/ProfitLossReport.jsx";
import SalesReports from "../modules/reports/pages/SalesReports.jsx";
import PurchasesReports from "../modules/reports/pages/PurchasesReports.jsx";
import InventoryReports from "../modules/reports/pages/InventoryReports.jsx";
import ProfitLossReports from "../modules/reports/pages/ProfitLossReports.jsx";
import AccountsReports from "../modules/reports/pages/AccountsReports.jsx";
import ReportDetailsPage from "../modules/reports/pages/ReportDetailsPage.jsx";
import ProductReturnList from "../modules/orderReturn/pages/OrderReturnList.jsx";
import CustomerPage from "../modules/customers/pages/CustomerPage.jsx";
import StaffList from "../modules/staff/pages/StaffList.jsx";
import StaffForm from "../modules/staff/pages/StaffForm.jsx";
import StaffDetail from "../modules/staff/pages/StaffDetail.jsx";
import StaffAttendance from "../modules/staff/pages/StaffAttendance.jsx";
import StaffReport from "../modules/reports/pages/StaffReport.jsx";
import GiantInventoryReport from "../modules/reports/pages/GiantInventoryReport.jsx";
import CreditsDebitsReport from "../modules/reports/pages/CreditsDebitsReport.jsx";
import OrderHistory from "../modules/orders/pages/OrderHistory.jsx";

function AppRoutes() {
    return (
        <Routes>

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/quick-list" element={<ProtectedRoute><QuickActions /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/products/categories" element={<ProtectedRoute><ProductCategoriesPage /></ProtectedRoute>} />
            <Route path="/products/sub-categories" element={<ProtectedRoute><ProductSubCategoriesPage /></ProtectedRoute>} />
            <Route path="/products/view/:id" element={<ProtectedRoute><ViewProductPage /></ProtectedRoute>} />
            <Route path="/products/batches" element={<ProtectedRoute><Products /></ProtectedRoute>} />




            <Route path="/purchases" element={<ProtectedRoute><ProductPurchase /></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute><SupplierPage /></ProtectedRoute>} />
            <Route path="/purchase-returns" element={<ProtectedRoute><PurchaseReturnPage /></ProtectedRoute>} />
            <Route path="/product-return" element={<ProtectedRoute><ProductReturnList /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><CustomerPage /></ProtectedRoute>} />
            <Route path="/wastage" element={<ProtectedRoute><WastagePage /></ProtectedRoute>} />
            <Route path="/qarzaAccount" element={<ProtectedRoute><QarzaAccounts /></ProtectedRoute>} />
            <Route path="/EachQarzaAccountRecord/:id" element={<ProtectedRoute><EachQarzaAccountRecords /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><AllExpenses /></ProtectedRoute>} />
            <Route path="/pos" element={<ProtectedRoute><PosPage /></ProtectedRoute>} />
            <Route path="/order-history" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
            <Route path="/settings/generals" element={<ProtectedRoute><Generals /></ProtectedRoute>} />

            {/* Reports Routes */}
            <Route path="/reports" element={<ProtectedRoute><MainBusinessReport /></ProtectedRoute>} />
            <Route path="/reports/main-business" element={<ProtectedRoute><MainBusinessReport /></ProtectedRoute>} />
            <Route path="/reports/profit-loss" element={<ProtectedRoute><ProfitLossReport /></ProtectedRoute>} />
            <Route path="/reports/sales" element={<ProtectedRoute><SalesReports /></ProtectedRoute>} />
            <Route path="/reports/purchases" element={<ProtectedRoute><PurchasesReports /></ProtectedRoute>} />
            <Route path="/reports/inventory" element={<ProtectedRoute><InventoryReports /></ProtectedRoute>} />
            <Route path="/reports/giant-inventory" element={<ProtectedRoute><GiantInventoryReport /></ProtectedRoute>} />
            <Route path="/reports/accounts-and-financials" element={<ProtectedRoute><AccountsReports /></ProtectedRoute>} />
            <Route path="/reports/profit-and-loss" element={<ProtectedRoute><ProfitLossReports /></ProtectedRoute>} />
            <Route path="/reports/staff" element={<ProtectedRoute><StaffReport /></ProtectedRoute>} />
            <Route path="/reports/credits-debits" element={<ProtectedRoute><CreditsDebitsReport /></ProtectedRoute>} />
            <Route path="/reports/sales/details" element={<ProtectedRoute><ReportDetailsPage /></ProtectedRoute>} />
            <Route path="/reports/purchases/details" element={<ProtectedRoute><ReportDetailsPage /></ProtectedRoute>} />
            <Route path="/reports/inventory/details" element={<ProtectedRoute><ReportDetailsPage /></ProtectedRoute>} />
            <Route path="/reports/finance/details" element={<ProtectedRoute><ReportDetailsPage /></ProtectedRoute>} />
            <Route path="/reports/profitLoss/details" element={<ProtectedRoute><ReportDetailsPage /></ProtectedRoute>} />

            {/* Staff Routes */}
            <Route path="/staff" element={<ProtectedRoute><StaffList /></ProtectedRoute>} />
            <Route path="/staff/create" element={<ProtectedRoute><StaffForm /></ProtectedRoute>} />
            <Route path="/staff/edit/:id" element={<ProtectedRoute><StaffForm isEdit={true} /></ProtectedRoute>} />
            <Route path="/staff/:id" element={<ProtectedRoute><StaffDetail /></ProtectedRoute>} />
            <Route path="/staff/attendance" element={<ProtectedRoute><StaffAttendance /></ProtectedRoute>} />

            {/* Auth Routes */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />

            {/* Default Route */}
            <Route path="/" element={<Login />} />
            <Route path="*" element={<Link to={"/login"}>go back</Link>} />
            {/* </Route> */}
        </Routes>
    );
}

export default AppRoutes;



