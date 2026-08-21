import mongoose from "mongoose";
import {
    getLocalStaffModel,
    getLocalOrderModel,
} from "../../../configs/connect.db.js";
import {
    createStaffService,
    findStaffService,
    findByIdStaffService,
    updateStaffService,
    deleteOneStaffService,
    countStaffService
} from "./staff.crud.js";
import { findDocs, findOneDoc, updateDocs, countDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import {
    createStaffSalaryPaymentService,
    findStaffSalaryPaymentService,
    findByIdStaffSalaryPaymentService,
    deleteOneStaffSalaryPaymentService,
    countStaffSalaryPaymentService
} from "./staffSalaryPayment.crud.js";
import {
    findStaffSalaryChangeService
} from "./staffSalaryChange.crud.js";
import {
    findStaffPercentageChangeService
} from "./staffPercentageChange.crud.js";
import {
    createStaffSaleBillService,
    findByIdStaffSaleBillService,
    updateStaffSaleBillService
} from "./staffSaleBill.crud.js";
import {
    findStaffAttendanceService,
    findOneStaffAttendanceService,
    createStaffAttendanceService,
    countStaffAttendanceService,
    updateStaffAttendanceService
} from "./staffAttendance.crud.js";

// Calculate staff commission from orders (with date range)
export const calculateStaffCommission = async (staffId, startDate, endDate) => {
    const OrderModel = getLocalOrderModel();
    const StaffModel = getLocalStaffModel();
    
    // Get staff details
    const staff = await findOneDoc({
        model: StaffModel,
        filter: { _id: staffId }
    });
    if (!staff) {
        throw new Error('Staff not found');
    }

    // Build base query for orders with this staff
    const matchQuery = {
        staffId: staffId,
        status: 'completed'
    };
    
    if (startDate || endDate) {
        matchQuery.createdAt = {};
        if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
        if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }
    
    const orders = await findDocs({
        model: OrderModel,
        filter: matchQuery
    });
    
    // Calculate commission for orders that don't have it yet (for percentage-based staff)
    // Only process if staff has salaryType and percentage fields (for backward compatibility)
    if (staff.salaryType === 'percentage' && staff.percentage > 0) {
        for (const order of orders) {
            if (!order.staffCommission || order.staffCommission === 0) {
                const commissionAmount = (order.totalAmount * staff.percentage) / 100;
                await updateDocs({
                    model: OrderModel,
                    filter: { _id: order._id },
                    data: { staffCommission: commissionAmount }
                });
                order.staffCommission = commissionAmount;
            }
        }
    }
    
    // Filter orders that have commission
    const ordersWithCommission = orders.filter(order => order.staffCommission > 0);
    
    const totalCommission = ordersWithCommission.reduce((sum, order) => sum + (order.staffCommission || 0), 0);
    const totalOrders = ordersWithCommission.length;
    const totalSales = ordersWithCommission.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    return {
        totalCommission,
        totalOrders,
        totalSales,
        orders: ordersWithCommission
    };
};

// Calculate all-time commission KPI (from staff join date to current)
export const calculateStaffCommissionAllTime = async (staffId) => {
    const OrderModel = getLocalOrderModel();
    const StaffModel = getLocalStaffModel();
    
    // Get staff details
    const staff = await findOneDoc({
        model: StaffModel,
        filter: { _id: staffId }
    });
    if (!staff) {
        throw new Error('Staff not found');
    }

    // Build query from staff join date to current
    const matchQuery = {
        staffId: staffId,
        status: 'completed',
        createdAt: { $gte: new Date(staff.joinDate) }
    };
    
    const orders = await findDocs({
        model: OrderModel,
        filter: matchQuery
    });
    
    // Calculate commission for orders that don't have it yet
    if (staff.salaryType === 'percentage' && staff.percentage > 0) {
        for (const order of orders) {
            if (!order.staffCommission || order.staffCommission === 0) {
                const commissionAmount = (order.totalAmount * staff.percentage) / 100;
                await updateDocs({
                    model: OrderModel,
                    filter: { _id: order._id },
                    data: { staffCommission: commissionAmount }
                });
                order.staffCommission = commissionAmount;
            }
        }
    }
    
    const ordersWithCommission = orders.filter(order => order.staffCommission > 0);
    
    const totalCommission = ordersWithCommission.reduce((sum, order) => sum + (order.staffCommission || 0), 0);
    const totalOrders = ordersWithCommission.length;
    const totalSales = ordersWithCommission.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    return {
        totalCommission,
        totalOrders,
        totalSales,
        joinDate: staff.joinDate,
        percentage: staff.percentage
    };
};

// Get paginated commission orders with date range
export const getStaffCommissionOrders = async (staffId, startDate, endDate, page = 1, limit = 20) => {
    const OrderModel = getLocalOrderModel();
    const StaffModel = getLocalStaffModel();
    
    // Get staff details
    const staff = await findOneDoc({
        model: StaffModel,
        filter: { _id: staffId }
    });
    if (!staff) {
        throw new Error('Staff not found');
    }

    // Build query
    const matchQuery = {
        staffId: staffId,
        status: 'completed'
    };
    
    if (startDate || endDate) {
        matchQuery.createdAt = {};
        if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
        if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const [orders, total] = await Promise.all([
        findDocs({
            model: OrderModel,
            filter: matchQuery,
            options: { sort: { createdAt: -1 }, skip, limit }
        }),
        countDocs({
            model: OrderModel,
            filter: matchQuery
        })
    ]);
    
    // Calculate commission for orders that don't have it yet
    if (staff.salaryType === 'percentage' && staff.percentage > 0) {
        for (const order of orders) {
            if (!order.staffCommission || order.staffCommission === 0) {
                const commissionAmount = (order.totalAmount * staff.percentage) / 100;
                await updateDocs({
                    model: OrderModel,
                    filter: { _id: order._id },
                    data: { staffCommission: commissionAmount }
                });
                order.staffCommission = commissionAmount;
            }
        }
    }
    
    const totalPages = Math.ceil(total / limit);
    
    return {
        orders,
        pagination: {
            page,
            limit,
            total,
            totalPages
        }
    };
};

// Get percentage breakdown with month-wise calculation and order-wise details
export const getPercentageBreakdown = async (staffId, startDate, endDate) => {
    const OrderModel = getLocalOrderModel();
    const StaffModel = getLocalStaffModel();
    
    // Get staff details
    const staff = await findOneDoc({
        model: StaffModel,
        filter: { _id: staffId }
    });
    if (!staff) {
        throw new Error('Staff not found');
    }
    
    // Get percentage changes for this staff
    const percentageChanges = await findStaffPercentageChangeService({
        staffId
    }, {
        sort: { percentageChangeFromDate: 1 }
    });
    
    // If no percentage changes and no custom startDate, return empty breakdown
    if (!startDate && (!percentageChanges || percentageChanges.length === 0)) {
        return {
            staffId,
            staffName: staff.fullName,
            basePercentage: staff.percentage || 0,
            startDate,
            endDate,
            breakdown: [],
            message: "No percentage changes found for this staff"
        };
    }
    
    // Determine start date: use provided startDate or first percentage change date
    let effectiveStartDate = startDate;
    if (!effectiveStartDate && percentageChanges && percentageChanges.length > 0) {
        effectiveStartDate = new Date(percentageChanges[0].percentageChangeFromDate);
        effectiveStartDate.setHours(0, 0, 0, 0);
        effectiveStartDate = effectiveStartDate.toISOString().split('T')[0];
    }
    
    // Build query for orders
    const matchQuery = {
        staffId: staffId,
        status: 'completed'
    };
    
    if (effectiveStartDate || endDate) {
        matchQuery.createdAt = {};
        if (effectiveStartDate) matchQuery.createdAt.$gte = new Date(effectiveStartDate);
        if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }
    
    const orders = await findDocs({
        model: OrderModel,
        filter: matchQuery,
        options: { sort: { createdAt: 1 } }
    });
    
    // If no orders, return empty breakdown
    if (orders.length === 0) {
        return {
            staffId,
            staffName: staff.fullName,
            basePercentage: staff.percentage || 0,
            startDate: effectiveStartDate,
            endDate,
            breakdown: []
        };
    }
    
    // Group orders by month
    const ordersByMonth = new Map();
    
    orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
        
        if (!ordersByMonth.has(monthKey)) {
            ordersByMonth.set(monthKey, []);
        }
        
        ordersByMonth.get(monthKey).push(order);
    });
    
    // Calculate breakdown for each month
    const breakdown = [];
    
    for (const [monthKey, monthOrders] of ordersByMonth) {
        const [year, month] = monthKey.split('-').map(Number);
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        
        // Calculate commission for each order with applicable percentage
        const orderDetails = monthOrders.map(order => {
            const orderDate = new Date(order.createdAt);
            orderDate.setHours(0, 0, 0, 0);
            
            // Find applicable percentage for this order
            let applicablePercentage = staff.percentage;
            let applicablePercentageChange = null;
            
            if (percentageChanges && percentageChanges.length > 0) {
                for (const change of percentageChanges) {
                    const changeDate = new Date(change.percentageChangeFromDate);
                    changeDate.setHours(0, 0, 0, 0);
                    
                    if (orderDate.getTime() >= changeDate.getTime()) {
                        applicablePercentage = change.percentage;
                        applicablePercentageChange = change;
                    }
                }
            }
            
            // Calculate commission
            const commissionAmount = (order.totalAmount * applicablePercentage) / 100;
            
            return {
                orderId: order._id,
                orderNumber: order.orderNumber,
                date: order.createdAt,
                totalAmount: order.totalAmount,
                percentage: applicablePercentage,
                percentageChange: applicablePercentageChange ? {
                    changeType: applicablePercentageChange.changeType,
                    percentage: applicablePercentageChange.percentage,
                    effectiveFrom: applicablePercentageChange.percentageChangeFromDate
                } : null,
                commission: commissionAmount
            };
        });
        
        const totalCommission = orderDetails.reduce((sum, detail) => sum + detail.commission, 0);
        const totalSales = orderDetails.reduce((sum, detail) => sum + detail.totalAmount, 0);
        
        breakdown.push({
            month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
            monthStart: monthStart.toISOString(),
            monthEnd: monthEnd.toISOString(),
            totalOrders: orderDetails.length,
            totalSales,
            totalCommission,
            orderDetails
        });
    }
    
    return {
        staffId,
        staffName: staff.fullName,
        basePercentage: staff.percentage,
        startDate,
        endDate,
        breakdown
    };
};

// Create staff sale bill from POS order
export const createStaffSaleBillFromPOS = async (staffId, posOrder) => {
    const StaffModel = getLocalStaffModel();
    
    // Fetch the staff
    const staff = await findOneDoc({
        model: StaffModel,
        filter: { _id: staffId }
    });
    if (!staff) {
        throw new Error('Staff not found');
    }
    
    // Check that staff salaryType is "percentage"
    if (staff.salaryType !== 'percentage') {
        throw new Error('Staff must have percentage salary type to create sale bill from POS');
    }
    
    // Map POS order items to StaffSaleBill items format
    const items = posOrder.items.map(item => ({
        name: item.product?.name || item.productName || 'Unknown',
        quantity: item.quantity,
        price: item.unitPrice || item.price
    }));
    
    // Calculate earned amount using staff's percentage
    const earnedAmount = (posOrder.totalAmount * staff.percentage) / 100;
    
    // Create and save StaffSaleBill
    const staffSaleBill = await createStaffSaleBillService({
        staffId,
        items,
        totalAmount: posOrder.totalAmount,
        percentage: staff.percentage,
        earnedAmount,
        source: 'pos',
        posOrderId: posOrder._id,
        isPaid: false
    });
    
    return staffSaleBill;
};

// Staff CRUD operations
export const createStaff = async (staffData) => {
    return await createStaffService(staffData);
};

export const getAllStaff = async (filters = {}) => {
    const { search, role, status, salaryType, page = 1, limit = 20 } = filters;
    
    const matchQuery = {};
    
    if (search) {
        matchQuery.$or = [
            { fullName: { $regex: search, $options: "i" } },
            { cnic: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } }
        ];
    }
    
    if (role) matchQuery.role = role;
    if (status) matchQuery.status = status;
    if (salaryType) matchQuery.salaryType = salaryType;
    
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
        findStaffService(matchQuery, {
            sort: { createdAt: -1 },
            skip: skip,
            limit: limit
        }),
        countStaffService(matchQuery)
    ]);
    
    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

export const getStaffById = async (staffId) => {
    const staff = await findByIdStaffService(staffId);
    if (!staff) {
        throw new Error('Staff not found');
    }
    return staff;
};

export const updateStaff = async (staffId, updateData) => {
    const staff = await updateStaffService(staffId, updateData);
    if (!staff) {
        throw new Error('Staff not found');
    }
    return staff;
};

export const deleteStaff = async (staffId) => {
    const staff = await deleteOneStaffService(staffId);
    if (!staff) {
        throw new Error('Staff not found');
    }
    return staff;
};

export const addDocumentToStaff = async (staffId, imageData) => {
    const staff = await updateStaffService(staffId, { $push: { documents: { $each: imageData } } });
    if (!staff) {
        throw new Error('Staff not found');
    }
    return staff;
};

export const removeDocumentFromStaff = async (staffId, documentId) => {
    const staff = await updateStaffService(staffId, { $pull: { documents: { _id: documentId } } });
    if (!staff) {
        throw new Error('Staff not found');
    }
    return staff;
};

// Staff Salary Payment operations
export const createSalaryPayment = async (paymentData) => {
    const payment = await createStaffSalaryPaymentService(paymentData);
    return payment;
};

export const getSalaryPaymentsByStaff = async (staffId, filters = {}) => {
    const { page = 1, limit = 20 } = filters;
    
    const matchQuery = { staffId };
    
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
        findStaffSalaryPaymentService(matchQuery, {
            sort: { paidAt: -1 },
            skip: skip,
            limit: limit
        }),
        countStaffSalaryPaymentService(matchQuery)
    ]);
    
    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

export const deleteSalaryPayment = async (paymentId) => {
    const payment = await deleteOneStaffSalaryPaymentService(paymentId);
    if (!payment) {
        throw new Error('Salary payment not found');
    }
    return payment;
};

// Staff Sale Bill operations
export const createSaleBill = async (billData) => {
    const bill = await createStaffSaleBillService(billData);
    return bill;
};

export const getSaleBillsByStaff = async (staffId, filters = {}) => {
    const OrderModel = getLocalOrderModel();
    const { page = 1, limit = 20, startDate, endDate } = filters;
    
    const matchQuery = { 
        staffId,
        isPosOrder: true,
        status: 'completed'
    };
    
    // Add date filter if provided
    if (startDate && endDate) {
        matchQuery.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
        findDocs({
            model: OrderModel,
            filter: matchQuery,
            options: {
                sort: { createdAt: -1 },
                skip: skip,
                limit: limit,
                populate: 'items.product'
            }
        }),
        countDocs({
            model: OrderModel,
            filter: matchQuery
        })
    ]);
    
    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

export const markSaleBillAsPaid = async (billId) => {
    const bill = await updateStaffSaleBillService(billId, { isPaid: true, paidAt: new Date() });
    if (!bill) {
        throw new Error('Sale bill not found');
    }
    return bill;
};

// Staff Attendance operations
export const getAttendanceByDate = async (date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await findOneStaffAttendanceService({
        date: { $gte: startOfDay, $lte: endOfDay }
    }, {
        populate: 'attendance.staff'
    });

    return attendance;
};

export const createOrUpdateAttendance = async (date, attendanceData, userId) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Attendance data received:', attendanceData);
    console.log('Staff ID type:', typeof attendanceData.staff);
    console.log('Staff ID value:', attendanceData.staff);

    if (!attendanceData.staff) {
        console.error('Staff ID is missing or undefined');
        throw new Error('Staff ID is required');
    }

    // Convert to ObjectId for Mongoose
    const staffObjectId = new mongoose.Types.ObjectId(attendanceData.staff);
    console.log('Converted to ObjectId:', staffObjectId);

    let attendance = await findOneStaffAttendanceService({
        date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (attendance) {
        // Update existing attendance
        const staffIndex = attendance.attendance.findIndex(
            a => a.staff.toString() === staffObjectId.toString()
        );

        if (staffIndex >= 0) {
            // Update existing staff attendance - explicitly set staff to preserve ObjectId
            attendance.attendance[staffIndex].status = attendanceData.status;
            attendance.attendance[staffIndex].lateHours = attendanceData.lateHours || 0;
            attendance.attendance[staffIndex].markedAt = new Date();
            attendance.attendance[staffIndex].staff = staffObjectId;
            
            console.log('Updated attendance item:', attendance.attendance[staffIndex]);
        } else {
            // Add new staff attendance
            attendance.attendance.push({
                staff: staffObjectId,
                status: attendanceData.status,
                lateHours: attendanceData.lateHours || 0,
                markedAt: new Date()
            });
        }

        console.log('Attendance array before save (update):', attendance.attendance);
        await updateStaffAttendanceService(attendance._id, { attendance: attendance.attendance });
    } else {
        // Create new attendance record
        console.log('Creating new attendance record with:', {
            date: startOfDay,
            staffId: staffObjectId,
            status: attendanceData.status,
            lateHours: attendanceData.lateHours
        });
        
        const newAttendance = await createStaffAttendanceService({
            date: startOfDay,
            attendance: [{
                staff: staffObjectId,
                status: attendanceData.status,
                lateHours: attendanceData.lateHours || 0,
                markedAt: new Date()
            }],
            createdBy: userId
        });
        
        console.log('Attendance object before save:', newAttendance);
        console.log('Attendance array:', newAttendance.attendance);
        
        attendance = newAttendance;
    }

    return attendance;
};

export const getAttendanceHistory = async (filters = {}) => {
    const { page = 1, limit = 20, startDate, endDate } = filters;

    const matchQuery = {};

    if (startDate && endDate) {
        matchQuery.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        findStaffAttendanceService(matchQuery, {
            sort: { date: -1 },
            skip: skip,
            limit: limit,
            populate: ['attendance.staff', { path: 'createdBy', select: 'fullName' }]
        }),
        countStaffAttendanceService(matchQuery)
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

export const getActiveStaff = async () => {
    const StaffModel = getLocalStaffModel();
    const staff = await findDocs({
        model: StaffModel,
        filter: { status: 'active' },
        options: { sort: { fullName: 1 } }
    });
    return staff;
};

// Calculate salary breakdown for fixed salary staff

// Helper function to calculate salary for a single day
const calculateDaySalary = (date, status, applicableSalaryChange, daysInMonth, applicablePercentageChange = null) => {
    let salaryAmount = applicableSalaryChange?.amount || 0;
    const isAbsenceCutEnabled = applicableSalaryChange?.isAbsenceCut === true;
    const absenceCutType = applicableSalaryChange?.absenceCutType || 'full';
    const absenceCutAmount = applicableSalaryChange?.absenceCut || 0;
    
    // Do NOT apply percentage changes - salary changes already contain the final amount
    // The percentage changes are for commission-based staff, not salary-based staff
    
    let dailySalary = salaryAmount / daysInMonth;
    let finalDailySalary = dailySalary;
    let actualAbsenceCut = 0;
    
    // Apply absence cut only if explicitly enabled and status is absent
    if (status === 'absent' && isAbsenceCutEnabled) {
        if (absenceCutType === 'full') {
            // Full cut: entire day salary is cut
            actualAbsenceCut = Math.round(dailySalary * 100) / 100;
            finalDailySalary = 0;
        } else if (absenceCutType === 'amount') {
            // Amount cut: only the specified amount is cut
            actualAbsenceCut = Math.round(absenceCutAmount * 100) / 100;
            finalDailySalary = dailySalary - actualAbsenceCut;
            if (finalDailySalary < 0) finalDailySalary = 0;
        }
    }
    
    return {
        date: date,
        status: status,
        dailySalary: Math.round(finalDailySalary * 100) / 100,
        absenceCutAmount: actualAbsenceCut,
        effectiveSalary: salaryAmount,
        isAbsenceCutEnabled: isAbsenceCutEnabled,
        absenceCutType: absenceCutType,
        absenceCutConfig: absenceCutAmount,
        originalDailySalary: Math.round(dailySalary * 100) / 100
    };
};

// Helper function to calculate salary for a month
const calculateMonthSalary = (monthStart, monthEnd, allSalaryChanges, allPercentageChanges, attendanceMap, baseSalary) => {
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    let monthCalculationDetails = [];
    let totalSalaryForMonth = 0;
    
    // Build salary change map for this month
    const salaryChangeMap = new Map();
    
    // Build percentage change map for this month
    const percentageChangeMap = new Map();
    
    // Normalize month dates for comparison
    const monthStartCopy = new Date(monthStart);
    monthStartCopy.setHours(0, 0, 0, 0);
    const monthEndCopy = new Date(monthEnd);
    monthEndCopy.setHours(23, 59, 59, 999);
    
    // Process salary changes
    if (allSalaryChanges && allSalaryChanges.length > 0) {
        // Sort salary changes by date
        allSalaryChanges.sort((a, b) => new Date(a.salaryChangeFromDate) - new Date(b.salaryChangeFromDate));
        
        // Filter salary changes that are relevant for this month
        // A change is relevant if it started before or during the month
        const relevantChanges = allSalaryChanges.filter(change => {
            const changeDate = new Date(change.salaryChangeFromDate);
            changeDate.setHours(0, 0, 0, 0);
            return changeDate <= monthEndCopy;
        });
        
        if (relevantChanges.length > 0) {
            // Check if first change is on or before month start
            const firstChangeDate = new Date(relevantChanges[0].salaryChangeFromDate);
            firstChangeDate.setHours(0, 0, 0, 0);
            
            const isFirstChangeOnOrBeforeMonthStart = firstChangeDate.getTime() <= monthStartCopy.getTime();
            
            // Add each salary change period
            for (let i = 0; i < relevantChanges.length; i++) {
                const change = relevantChanges[i];
                const nextChange = relevantChanges[i + 1];
                
                let periodStartDate = new Date(change.salaryChangeFromDate);
                periodStartDate.setHours(0, 0, 0, 0);
                
                // If this is the first change and it's before month start, use month start as period start
                if (i === 0 && isFirstChangeOnOrBeforeMonthStart) {
                    periodStartDate = new Date(monthStartCopy);
                }
                
                let periodEndDate;
                if (nextChange) {
                    periodEndDate = new Date(nextChange.salaryChangeFromDate);
                    periodEndDate.setHours(0, 0, 0, 0);
                    // Subtract one day to include the next change date in the current period
                    periodEndDate.setDate(periodEndDate.getDate() - 1);
                    periodEndDate.setHours(23, 59, 59, 999);
                } else {
                    // For the last period, extend to end of month
                    periodEndDate = new Date(monthEndCopy);
                }
                
                salaryChangeMap.set({
                    startDate: periodStartDate,
                    endDate: periodEndDate
                }, change);
            }
        }
    }
    
    // Process percentage changes (same logic as salary changes)
    if (allPercentageChanges && allPercentageChanges.length > 0) {
        // Sort percentage changes by date
        allPercentageChanges.sort((a, b) => new Date(a.percentageChangeFromDate) - new Date(b.percentageChangeFromDate));
        
        // Filter percentage changes that are relevant for this month
        const relevantPercentageChanges = allPercentageChanges.filter(change => {
            const changeDate = new Date(change.percentageChangeFromDate);
            changeDate.setHours(0, 0, 0, 0);
            return changeDate <= monthEndCopy;
        });
        
        if (relevantPercentageChanges.length > 0) {
            // Check if first change is on or before month start
            const firstChangeDate = new Date(relevantPercentageChanges[0].percentageChangeFromDate);
            firstChangeDate.setHours(0, 0, 0, 0);
            
            const isFirstChangeOnOrBeforeMonthStart = firstChangeDate.getTime() <= monthStartCopy.getTime();
            
            // Add each percentage change period
            for (let i = 0; i < relevantPercentageChanges.length; i++) {
                const change = relevantPercentageChanges[i];
                const nextChange = relevantPercentageChanges[i + 1];
                
                let periodStartDate = new Date(change.percentageChangeFromDate);
                periodStartDate.setHours(0, 0, 0, 0);
                
                // If this is the first change and it's before month start, use month start as period start
                if (i === 0 && isFirstChangeOnOrBeforeMonthStart) {
                    periodStartDate = new Date(monthStartCopy);
                }
                
                let periodEndDate;
                if (nextChange) {
                    periodEndDate = new Date(nextChange.percentageChangeFromDate);
                    periodEndDate.setHours(0, 0, 0, 0);
                    // Subtract one day to include the next change date in the current period
                    periodEndDate.setDate(periodEndDate.getDate() - 1);
                    periodEndDate.setHours(23, 59, 59, 999);
                } else {
                    // For the last period, extend to end of month
                    periodEndDate = new Date(monthEndCopy);
                }
                
                percentageChangeMap.set({
                    startDate: periodStartDate,
                    endDate: periodEndDate
                }, change);
            }
        }
    }
    
    // Calculate salary for each day
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDateCheck = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
        currentDateCheck.setHours(0, 0, 0, 0);
        
        // Skip future days
        if (currentDateCheck > currentDate) {
            break;
        }
        
        const dateStr = currentDateCheck.toDateString();
        const status = attendanceMap.get(dateStr) || 'absent';
        
        // Find applicable salary change for this day
        let applicableSalaryChange = null;
        for (const [period, change] of salaryChangeMap) {
            // Normalize period dates for comparison
            const periodStart = new Date(period.startDate);
            periodStart.setHours(0, 0, 0, 0);
            const periodEnd = new Date(period.endDate);
            
            // Keep the end time as is for proper comparison (could be 23:59:59 for month end)
            // Only normalize if it's a start of day (like from a change date)
            if (periodEnd.getHours() === 0 && periodEnd.getMinutes() === 0) {
                periodEnd.setHours(0, 0, 0, 0);
            }
            
            // Use <= for end date to include the end date in the period
            if (currentDateCheck.getTime() >= periodStart.getTime() && currentDateCheck.getTime() <= periodEnd.getTime()) {
                applicableSalaryChange = change;
                break;
            }
        }
        
        // Find applicable percentage change for this day
        let applicablePercentageChange = null;
        for (const [period, change] of percentageChangeMap) {
            // Normalize period dates for comparison
            const periodStart = new Date(period.startDate);
            periodStart.setHours(0, 0, 0, 0);
            const periodEnd = new Date(period.endDate);
            
            // Keep the end time as is for proper comparison (could be 23:59:59 for month end)
            // Only normalize if it's a start of day (like from a change date)
            if (periodEnd.getHours() === 0 && periodEnd.getMinutes() === 0) {
                periodEnd.setHours(0, 0, 0, 0);
            }
            
            // Use <= for end date to include the end date in the period
            if (currentDateCheck.getTime() >= periodStart.getTime() && currentDateCheck.getTime() <= periodEnd.getTime()) {
                applicablePercentageChange = change;
                break;
            }
        }
        
        // Only calculate salary if there's an applicable salary change for this day
        // This ensures we don't calculate for days before the first salary change
        if (!applicableSalaryChange) {
            continue;
        }
        
        // Calculate day salary (pass percentage change if applicable)
        const dayCalculation = calculateDaySalary(dateStr, status, applicableSalaryChange, daysInMonth, applicablePercentageChange);
        monthCalculationDetails.push(dayCalculation);
        totalSalaryForMonth += dayCalculation.dailySalary;
    }
    
    return {
        month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
        totalSalary: Math.round(totalSalaryForMonth * 100) / 100,
        calculationDetails: monthCalculationDetails
    };
};

// Main service function for full salary calculation
const staffFullSalaryCalculation = async (staffId, staff, salaryChanges, percentageChanges, attendanceMap, baseSalary) => {
    if (!salaryChanges || salaryChanges.length === 0) {
        return [];
    }
    
    // Sort salary changes by date
    salaryChanges.sort((a, b) => new Date(a.salaryChangeFromDate) - new Date(b.salaryChangeFromDate));
    
    // Sort percentage changes by date if they exist
    if (percentageChanges && percentageChanges.length > 0) {
        percentageChanges.sort((a, b) => new Date(a.percentageChangeFromDate) - new Date(b.percentageChangeFromDate));
    }
    
    // Start from the first salary change date
    const firstSalaryChangeDate = new Date(salaryChanges[0].salaryChangeFromDate);
    const currentDate = new Date();
    
    // Generate array of months from first salary change to current date
    const months = [];
    let monthStart = new Date(firstSalaryChangeDate);
    monthStart.setDate(1);
    
    while (monthStart <= currentDate) {
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        
        months.push({
            start: new Date(monthStart),
            end: new Date(monthEnd)
        });
        
        monthStart.setMonth(monthStart.getMonth() + 1);
    }
    
    // Calculate salary for each month
    const monthlyBreakdown = [];
    for (const month of months) {
        // Pass ALL salary changes and percentage changes to calculateMonthSalary
        // The function will determine which changes are active for each day
        // Calculate month salary
        const monthResult = calculateMonthSalary(
            month.start,
            month.end,
            salaryChanges,
            percentageChanges,
            attendanceMap,
            baseSalary
        );
        
        monthlyBreakdown.push(monthResult);
    }
    
    return monthlyBreakdown;
};

export const getSalaryBreakdown = async (staffId, startDate, endDate) => {
    const StaffModel = getLocalStaffModel();
    
    const staff = await findOneDoc({
        model: StaffModel,
        filter: { _id: staffId }
    });
    if (!staff) {
        throw new Error('Staff not found');
    }
    
    const requestStartDate = new Date(startDate);
    const requestEndDate = new Date(endDate);
    
    // Get salary changes for this staff
    const salaryChanges = await findStaffSalaryChangeService({
        staffId
    }, {
        sort: { salaryChangeFromDate: 1 }
    });
    
    // If no salary changes, return empty breakdown
    if (salaryChanges.length === 0) {
        return {
            staffId,
            staffName: staff.fullName,
            monthlySalary: 0,
            startDate: requestStartDate.toISOString(),
            endDate: requestEndDate.toISOString(),
            breakdown: []
        };
    }
    
    // Get percentage changes for this staff
    const percentageChanges = await findStaffPercentageChangeService({
        staffId
    }, {
        sort: { percentageChangeFromDate: 1 }
    });
    
    // Get attendance data for this staff from first salary change date to end date
    const firstSalaryChangeDate = new Date(salaryChanges[0].salaryChangeFromDate);
    const attendanceData = await findStaffAttendanceService({
        date: { $gte: firstSalaryChangeDate, $lte: requestEndDate }
    });
    
    // Create a map of attendance data by date for quick lookup
    const attendanceMap = new Map();
    attendanceData.forEach(record => {
        const dateStr = new Date(record.date).toDateString();
        if (record.attendance && record.attendance.length > 0) {
            const staffAttendance = record.attendance.find(a => a.staff.toString() === staffId.toString());
            if (staffAttendance) {
                attendanceMap.set(dateStr, staffAttendance.status);
            }
        }
    });
    
    // Use the new full salary calculation function
    const monthlyCalculationResults = await staffFullSalaryCalculation(
        staffId,
        staff,
        salaryChanges,
        percentageChanges,
        attendanceMap,
        0 // baseMonthlySalary - will use salary changes values
    );
    
    // Filter months within the requested date range
    const breakdown = [];
    
    for (const monthResult of monthlyCalculationResults) {
        // Parse the month string to get the first day of the month
        const monthDate = new Date(monthResult.month);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        // Check if month overlaps with the requested date range
        // Include month if month end >= request start AND month start <= request end
        if (monthEnd < requestStartDate || monthStart > requestEndDate) {
            continue;
        }
        
        // Calculate attendance counts from calculation details
        let presentDays = 0;
        let absentDays = 0;
        let leaveDays = 0;
        let lateDays = 0;
        let workingDays = 0;
        
        monthResult.calculationDetails.forEach(detail => {
            if (detail.status === 'present') {
                presentDays++;
                workingDays++;
            } else if (detail.status === 'absent') {
                absentDays++;
            } else if (detail.status === 'leave') {
                leaveDays++;
                workingDays++;
            } else if (detail.status === 'late') {
                lateDays++;
                workingDays++;
            }
        });
        
        const daysInMonth = monthResult.calculationDetails.length;
        const salaryForMonth = monthResult.totalSalary;
        
        breakdown.push({
            month: monthResult.month,
            workingDays,
            totalDays: daysInMonth,
            salaryForMonth,
            presentDays,
            absentDays,
            leaveDays,
            lateDays,
            calculationDetails: monthResult.calculationDetails
        });
    }
    
    return {
        staffId,
        staffName: staff.fullName,
        monthlySalary: salaryChanges[salaryChanges.length - 1]?.amount || 0,
        startDate: requestStartDate.toISOString(),
        endDate: requestEndDate.toISOString(),
        breakdown
    };
};

// Calculate payment summary for staff
export const calculatePaymentSummary = async (staffId, startDate = null, endDate = null) => {
    const StaffModel = getLocalStaffModel();
    
    const staff = await findOneDoc({
        model: StaffModel,
        filter: { _id: staffId }
    });
    if (!staff) {
        throw new Error('Staff not found');
    }
    
    // Determine date range
    let effectiveStartDate = startDate;
    let effectiveEndDate = endDate || new Date();
    
    if (!effectiveStartDate) {
        // Use earliest change date as start date
        const salaryChanges = await findStaffSalaryChangeService({
            staffId,
            isDeleted: false
        }, {
            sort: { salaryChangeFromDate: 1 },
            limit: 1
        });
        
        const percentageChanges = await findStaffPercentageChangeService({
            staffId
        }, {
            sort: { percentageChangeFromDate: 1 },
            limit: 1
        });
        
        if (salaryChanges && salaryChanges.length > 0) {
            effectiveStartDate = new Date(salaryChanges[0].salaryChangeFromDate);
        } else if (percentageChanges && percentageChanges.length > 0) {
            effectiveStartDate = new Date(percentageChanges[0].percentageChangeFromDate);
        } else {
            effectiveStartDate = new Date(staff.joinDate || staff.createdAt);
        }
    }
    
    let totalSalaryEarnings = 0;
    let totalCommissionEarnings = 0;
    let totalEarnings = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let totalAdvance = 0;
    let paymentStatus = 'remaining';
    let salaryType = 'none';
    let currentPercentage = 0;
    let currentMonthlySalary = 0;
    
    // Use salary breakdown function to get salary earnings
    let salaryBreakdown = null;
    try {
        salaryBreakdown = await getSalaryBreakdown(staffId, effectiveStartDate.toISOString(), effectiveEndDate.toISOString());
        console.log('Salary breakdown received:', JSON.stringify(salaryBreakdown, null, 2));
    } catch (error) {
        console.log('Salary breakdown error:', error.message);
    }
    
    if (salaryBreakdown && salaryBreakdown.breakdown && salaryBreakdown.breakdown.length > 0) {
        totalSalaryEarnings = salaryBreakdown.breakdown.reduce((sum, month) => sum + (month.salaryForMonth || 0), 0);
        currentMonthlySalary = salaryBreakdown.monthlySalary || 0;
        console.log('Total salary earnings from breakdown:', totalSalaryEarnings);
        if (salaryType === 'none') {
            salaryType = 'fixed';
        }
    }
    
    // Use percentage breakdown function to get commission earnings
    let percentageBreakdown = null;
    try {
        percentageBreakdown = await getPercentageBreakdown(staffId, effectiveStartDate.toISOString(), effectiveEndDate.toISOString());
        console.log('Percentage breakdown received:', JSON.stringify(percentageBreakdown, null, 2));
    } catch (error) {
        console.log('Percentage breakdown error:', error.message);
    }
    
    if (percentageBreakdown && percentageBreakdown.breakdown && percentageBreakdown.breakdown.length > 0) {
        totalCommissionEarnings = percentageBreakdown.breakdown.reduce((sum, month) => sum + (month.totalCommission || 0), 0);
        currentPercentage = percentageBreakdown.percentage || 0;
        console.log('Total commission earnings from breakdown:', totalCommissionEarnings);
        if (salaryType === 'none') {
            salaryType = 'percentage';
        }
    }
    
    // If both exist, set to mixed
    if (totalSalaryEarnings > 0 && totalCommissionEarnings > 0) {
        salaryType = 'mixed';
    }
    
    totalEarnings = totalSalaryEarnings + totalCommissionEarnings;
    console.log('Final totals - Salary:', totalSalaryEarnings, 'Commission:', totalCommissionEarnings, 'Total:', totalEarnings);
    
    // Get payments within date range
    const paymentQuery = { staffId };
    if (effectiveStartDate || effectiveEndDate) {
        paymentQuery.paidAt = {};
        if (effectiveStartDate) paymentQuery.paidAt.$gte = new Date(effectiveStartDate);
        if (effectiveEndDate) paymentQuery.paidAt.$lte = new Date(effectiveEndDate);
    }
    
    const payments = await findStaffSalaryPaymentService(paymentQuery);
    totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    totalRemaining = Math.max(0, totalEarnings - totalPaid);
    totalAdvance = Math.max(0, totalPaid - totalEarnings);
    
    if (totalPaid >= totalEarnings) {
        paymentStatus = 'advanced';
    } else if (totalPaid > 0) {
        paymentStatus = 'partial';
    } else {
        paymentStatus = 'remaining';
    }
    
    return {
        staffId,
        staffName: staff.fullName,
        salaryType,
        percentage: currentPercentage,
        monthlySalary: currentMonthlySalary,
        joinDate: effectiveStartDate,
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
        totalSalaryEarnings: Math.round(totalSalaryEarnings * 100) / 100,
        totalCommissionEarnings: Math.round(totalCommissionEarnings * 100) / 100,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalRemaining: Math.round(totalRemaining * 100) / 100,
        totalAdvance: Math.round(totalAdvance * 100) / 100,
        paymentStatus
    };
};

