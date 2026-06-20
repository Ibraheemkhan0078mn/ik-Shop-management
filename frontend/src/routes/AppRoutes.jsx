import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Login from "@modules/auth/pages/Login.jsx";
import Signup from "@modules/auth/pages/Signup.jsx";
import Products from "@modules/productsModule/pages/Products.jsx";
import BusinessExpenses from "@modules/expense/pages/AllExpense.jsx";
import Analytics from "@modules/dashbaord/pages/Analytics.jsx";
import Dashboard from "@modules/dashbaord/pages/Dashboard.jsx";
import Generals from "@modules/setting/pages/Generals.jsx";
import ReturnPage from "@modules/returns/pages/ReturnPage.jsx";
import WastagePage from "@modules/wastage/pages/WastagePage.jsx";
import ProductPurchase from "@modules/productPurchases/pages/ProductPurchase.jsx";
import SupplierPage from "@modules/suppliers/pages/SupplierPage.jsx";
import PurchaseReturnPage from "@modules/purchaseReturn/pages/PurchaseReturnPage.jsx";
import ViewProductPage from "@modules/productsModule/pages/Products.jsx";
import QuickActions from "@modules/dashbaord/pages/QuickActions.jsx";
import QarzaAccounts from "@modules/qarza/pages/QarzaAccounts.jsx";
import EachQarzaAccountRecords from "@modules/qarza/pages/EachQarzaAccountRecords.jsx";
import Inventory from "@modules/inventory/pages/Inventory.jsx";
import AllExpenses from "@modules/expense/pages/AllExpense.jsx";
import PosPage from "@modules/POSmodule/pages/PosPage.jsx";
import Categories from "@modules/productsModule/components/Categories.jsx";
import SubCategories from "@modules/productsModule/components/SubCategories.jsx";
import ReportsPage from "@modules/reports/pages/ReportsPage.jsx";
import SalesReports from "@modules/reports/pages/SalesReports.jsx";
import PurchasesReports from "@modules/reports/pages/PurchasesReports.jsx";
import InventoryReports from "@modules/reports/pages/InventoryReports.jsx";
import ProfitLossReports from "@modules/reports/pages/ProfitLossReports.jsx";
import AccountsReports from "@modules/reports/pages/AccountsReports.jsx";
import ReportDetailsPage from "@modules/reports/pages/ReportDetailsPage.jsx";
import ProductReturnList from "@modules/productReturn/pages/ProductReturnList.jsx";


function AppRoutes() {
    return (
        <Routes>

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/quick-list" element={<QuickActions />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/categories" element={<Categories />} />
            <Route path="/products/sub-categories" element={<SubCategories />} />
            <Route path="/products/view/:id" element={<ViewProductPage />} />
            <Route path="/products/batches" element={<Products />} />




            <Route path="/purchases" element={<ProductPurchase />} />
            <Route path="/suppliers" element={<SupplierPage />} />
            <Route path="/returns" element={<ReturnPage />} />
            <Route path="/purchase-returns" element={<PurchaseReturnPage />} />
            <Route path="/product-return" element={<ProductReturnList />} />
            <Route path="/wastage" element={<WastagePage />} />





            <Route path="/qarzaAccount" element={<QarzaAccounts />} />
            <Route path="/EachQarzaAccountRecord/:id" element={<EachQarzaAccountRecords />} />
            <Route path="/assets" element={<Inventory />} />
            <Route path="/expenses" element={<AllExpenses />} />
            <Route path="/pos" element={<PosPage />} />
            <Route path="/settings/generals" element={<Generals />} />

            {/* Reports Routes */}
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/sales" element={<SalesReports />} />
            <Route path="/reports/purchases" element={<PurchasesReports />} />
            <Route path="/reports/inventory" element={<InventoryReports />} />
            <Route path="/reports/accounts-and-financials" element={<AccountsReports />} />
            <Route path="/reports/profit-and-loss" element={<ProfitLossReports />} />
            <Route path="/reports/sales/details" element={<ReportDetailsPage />} />
            <Route path="/reports/purchases/details" element={<ReportDetailsPage />} />
            <Route path="/reports/inventory/details" element={<ReportDetailsPage />} />
            <Route path="/reports/finance/details" element={<ReportDetailsPage />} />
            <Route path="/reports/profitLoss/details" element={<ReportDetailsPage />} />

            {/* Member Routes */}
            <Route path="/member" element={<Analytics />} />
            <Route path="/members" element={<Analytics />} />

            {/* Investor Routes */}
            <Route path="/investor" element={<Analytics />} />

            {/* Default Route */}
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<Link to={"/dashboard"}>go back</Link>} />
            {/* </Route> */}
        </Routes>
    );
}

export default AppRoutes;



