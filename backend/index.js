import express from "express";
import dontenv from "dotenv";
// import MongoStore from "connect-mongo";
import session from "express-session";
import cors from "cors";

import { connectDb } from "./configs/connect.db.js";
import errorHandler from "./common/middlewares/error.middleware.js";
import { uploadDir } from "./common/services/uploadDirectory.js";

import AuthRouter from "./modules/auth/routes/auth.router.js";
import ProductRouter from "./modules/product/routes/product.router.js";
import BatchRouter from "./modules/productPurchases/routes/batch.router.js";
import CategoryRouter from "./modules/product/routes/category.router.js";
import SubCategoryRouter from "./modules/product/routes/subCategory.router.js";
import SupplierRouter from "./modules/suppliers/routes/supplier.router.js";
import PurchaseRouter from "./modules/productPurchases/routes/purchase.router.js";
import OrderRouter from "./modules/pos/routes/order.router.js";
import HoldOrderRouter from "./modules/pos/routes/holdOrder.router.js";

import expensesRouter from './modules/expenses/routes/expenses.route.js'
import memberRoutes from './modules/member/routes/member.route.js'
import inventoryRoutes from './modules/assets/routes/assets.route.js'
import permissionRoutes from './modules/permission/route/permission.route.js'
import qarzaRoutes from './modules/qarza/routes/qarza.route.js'
import wastageRoutes from './modules/wastage/routes/wastage.router.js'
import purchaseReturnRoutes from './modules/purchaseReturn/routes/purchaseReturn.route.js'
import inventoryReconciliationRoutes from './modules/inventory/routes/reconciliation.route.js'
import ReportsRouter from './modules/reports/routes/reports.routes.js'
import ProductReturnRouter from './modules/productReturn/routes/productReturn.routes.js'
import CustomerRouter from './modules/customer/routes/customer.route.js'

dontenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
    cors(
        {
            origin: ["http://localhost:5173"],
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        }
    ),
);

// Serve uploaded files (product images etc.) from the shared uploads dir.
app.use("/uploads", express.static(uploadDir));

// app.use(
//     session({
//         secret: process.env.SESSION_SECRET || "ims_secret_key",
//         resave: false,
//         saveUninitialized: false,
//         store: MongoStore.create({
//             mongoUrl: process.env.MONGO_URI_LOCAL,
//             collectionName: "sessions",
//             ttl: 14 * 24 * 60 * 60,
//         }),
//         cookie: {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production",
//             maxAge: 1000 * 60 * 60 * 24,
//         },
//     }),
// );

app.use("/api/auth", AuthRouter);
app.use("/api/products", ProductRouter);
app.use("/api/batches", BatchRouter);
app.use("/api/categories", CategoryRouter);
app.use("/api/subcategories", SubCategoryRouter);
app.use("/api/suppliers", SupplierRouter);
app.use("/api/purchases", PurchaseRouter);
app.use("/api/orders", OrderRouter);
app.use("/api/hold-orders", HoldOrderRouter);


app.use("/api/expenseRoutes", expensesRouter)
app.use("/api/memberRoutes", memberRoutes)
app.use("/api/memberRoute", memberRoutes)  // RTK API uses /memberRoute (no 's')
app.use("/api/invetoryRoutes", inventoryRoutes)
app.use("/api/permissionRoutes", permissionRoutes)
app.use("/api/qarzaRoutes", qarzaRoutes)
app.use("/api/wastages", wastageRoutes)
app.use("/api/purchase-returns", purchaseReturnRoutes)
app.use("/api/inventory", inventoryReconciliationRoutes)
app.use("/api/reports", ReportsRouter)
app.use("/api/product-returns", ProductReturnRouter)
app.use("/api/customers", CustomerRouter)

app.use(errorHandler);

const PORT = process.env.PORT || 5001;

connectDb();
app.listen(PORT, () => {
    console.log(`Server is listing on ${PORT} `);
});
