import asyncHandler from "express-async-handler";
import { getDashboardData } from "./dashboard.service.js";

export const getDashboard = asyncHandler(async (req, res) => {
    const data = await getDashboardData();
    res.status(200).json({ success: true, data });
});
