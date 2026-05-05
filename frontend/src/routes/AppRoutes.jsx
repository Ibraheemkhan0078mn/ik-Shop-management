import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Login from "../modules/auth/pages/Login.jsx";
import Signup from "../modules/auth/pages/Signup";
import Products from "../modules/productsModule/pages/Products.jsx";
import StaffPage from "../modules/teacher/pages/AllTeachers.jsx";
import BusinessExpenses from "../modules/expense/pages/AllExpense.jsx";
import Analytics from "../modules/dashbaord/pages/Analytics";
import Generals from "../modules/setting/pages/Generals.jsx";
import ReturnPage from "../modules/stock/pages/ReturnPage.jsx";
import AddPurchaseModal from "../modules/stock/components/AddPurchases.jsx";
import ViewProductPage from "../modules/productsModule/pages/Products.jsx";
import QuickActions from "../modules/dashbaord/pages/QuickActions.jsx"
import QarzaAccounts from "../modules/qarza/pages/QarzaAccounts.jsx";
import EachQarzaAccountRecords from "../modules/qarza/pages/EachQarzaAccountRecords.jsx";
import AllTeachers from "../modules/teacher/pages/AllTeachers.jsx";
import AllInvestors from "../modules/Investor/pages/AllInvestors.jsx";
import Inventory from "../modules/Inventory/pages/Inventory.jsx";
import AllExpenses from "../modules/expense/pages/AllExpense.jsx";
import PosPage from "../modules/POSmodule/pages/PosPage.jsx";
import Categories from "../modules/productsModule/components/Categories.jsx";
import SubCategories from "../modules/productsModule/components/SubCategories.jsx";
import ProductPurchase from '../modules/stock/pages/ProductPurchase.jsx'

function AppRoutes() {
    return (
        <Routes>

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/quick-actions" element={<QuickActions />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/categories" element={<Categories />} />
            <Route path="/products/sub-categories" element={<SubCategories />} />
            <Route path="/products/view/:id" element={<ViewProductPage />} />
            <Route path="/purchases" element={<ProductPurchase />} />
            <Route path="/accounts/staff" element={<AllTeachers />} />
            <Route path="/qarzaAccount" element={<QarzaAccounts />} />
            <Route path="/EachQarzaAccountRecord/:id" element={<EachQarzaAccountRecords />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/member" element={<AllTeachers />} />
            <Route path="/investor" element={<AllInvestors />} />
            <Route path="/assets" element={<Inventory />} />
            <Route path="/expenses" element={<AllExpenses />} />
            <Route path="/pos" element={<PosPage />} />
            <Route path="*" element={<Link to={"/dashboard/analytics"}>go back</Link>} />
            {/* </Route> */}
        </Routes>
    );
}

export default AppRoutes;
