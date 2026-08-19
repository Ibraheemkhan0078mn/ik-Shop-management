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
export const calculateSalaryBreakdown = async (staffId, startDate, endDate) => {
    const StaffModel = getLocalStaffModel();
    
    const staff = await findOneDoc({
        model: StaffModel,
        filter: { _id: staffId }
    });
    if (!staff) {
        throw new Error('Staff not found');
    }
    
    if (staff.salaryType !== 'fixed') {
        throw new Error('Salary breakdown is only applicable for fixed salary staff');
    }
    
    const monthlySalary = staff.monthlySalary || 0;
    const joinDate = new Date(staff.joinDate);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get ALL payments for this staff (not just within date range) for FIFO allocation
    const allPayments = await findStaffSalaryPaymentService({
        staffId
    }, {
        sort: { paidAt: 1 }
    });
    
    // Get attendance data for this staff from join date to end date
    const attendanceData = await findStaffAttendanceService({
        date: { $gte: new Date(joinDate), $lte: new Date(end) }
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
    
    // Generate month-wise breakdown from join date to current date
    const breakdown = [];
    const currentDate = new Date();
    currentDate.setDate(1);
    
    // Start from the join date's month
    let monthStart = new Date(joinDate);
    monthStart.setDate(1);
    
    // Track remaining payment amount for FIFO allocation
    let paymentIndex = 0;
    let remainingPaymentAmount = 0;
    
    while (monthStart <= currentDate) {
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        
        // If month is before the requested start date, skip it
        if (monthEnd < new Date(startDate)) {
            monthStart.setMonth(monthStart.getMonth() + 1);
            continue;
        }
        
        // If month is after the requested end date, skip it
        if (monthStart > new Date(endDate)) {
            break;
        }
        
        const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
        
        // Count actual working days from attendance data
        let workingDays = 0;
        let presentDays = 0;
        let absentDays = 0;
        let leaveDays = 0;
        let lateDays = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDateCheck = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
            
            // Skip days before join date
            if (currentDateCheck < joinDate) {
                continue;
            }
            
            // Skip future days in current month
            if (currentDateCheck > new Date()) {
                break;
            }
            
            const dateStr = currentDateCheck.toDateString();
            const status = attendanceMap.get(dateStr);
            
            if (status === 'present') {
                workingDays++;
                presentDays++;
            } else if (status === 'late') {
                workingDays++;
                lateDays++;
            } else if (status === 'leave') {
                leaveDays++;
            } else if (status === 'absent') {
                absentDays++;
            } else {
                // No attendance record - count as absent
                absentDays++;
            }
        }
        
        // Calculate salary based on actual working days
        let salaryForMonth = 0;
        if (workingDays > 0) {
            salaryForMonth = (monthlySalary / daysInMonth) * workingDays;
        }
        
        // Allocate payments using FIFO method
        let allocatedPayments = [];
        let totalPaid = 0;
        let remainingForMonth = salaryForMonth;
        
        while (remainingForMonth > 0.01 && paymentIndex < allPayments.length) {
            const payment = allPayments[paymentIndex];
            
            if (remainingPaymentAmount === 0) {
                remainingPaymentAmount = payment.amount || 0;
            }
            
            const allocationAmount = Math.min(remainingPaymentAmount, remainingForMonth);
            
            if (allocationAmount > 0) {
                allocatedPayments.push({
                    id: payment._id,
                    amount: allocationAmount,
                    originalAmount: payment.amount,
                    paidAt: payment.paidAt,
                    notes: payment.notes
                });
                
                totalPaid += allocationAmount;
                remainingForMonth -= allocationAmount;
                remainingPaymentAmount -= allocationAmount;
            }
            
            if (remainingPaymentAmount <= 0.01) {
                paymentIndex++;
                remainingPaymentAmount = 0;
            }
        }
        
        const remaining = Math.max(0, salaryForMonth - totalPaid);
        
        let paymentStatus = 'remaining';
        if (totalPaid >= salaryForMonth) {
            paymentStatus = 'full';
        } else if (totalPaid > 0) {
            paymentStatus = 'partial';
        }
        
        const monthName = monthStart.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        breakdown.push({
            month: monthName,
            monthStart: monthStart.toISOString(),
            monthEnd: monthEnd.toISOString(),
            workingDays,
            totalDays: daysInMonth,
            presentDays,
            absentDays,
            leaveDays,
            lateDays,
            salaryForMonth: Math.round(salaryForMonth * 100) / 100,
            totalPaid: Math.round(totalPaid * 100) / 100,
            remaining: Math.round(remaining * 100) / 100,
            paymentStatus,
            payments: allocatedPayments
        });
        
        // Move to next month
        monthStart.setMonth(monthStart.getMonth() + 1);
    }
    
    return {
        staffId,
        staffName: staff.fullName,
        monthlySalary,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        breakdown
    };
};

// Calculate payment summary for staff
export const calculatePaymentSummary = async (staffId) => {
    const StaffModel = getLocalStaffModel();
    const OrderModel = getLocalOrderModel();
    
    const staff = await findOneDoc({
        model: StaffModel,
        filter: { _id: staffId }
    });
    if (!staff) {
        throw new Error('Staff not found');
    }
    
    let totalEarnings = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let totalAdvance = 0;
    let paymentStatus = 'remaining';
    
    if (staff.salaryType === 'percentage') {
        // Calculate from all completed orders (all-time)
        const orders = await findDocs({
            model: OrderModel,
            filter: {
                staffId,
                status: 'completed'
            }
        });
        
        totalEarnings = orders.reduce((sum, order) => {
            return sum + (order.staffCommission || 0);
        }, 0);
        
        // Get all payments (all-time)
        const payments = await findStaffSalaryPaymentService({ staffId });
        totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
    } else if (staff.salaryType === 'fixed') {
        // Calculate from join date to now
        const joinDate = new Date(staff.joinDate);
        const currentDate = new Date();
        
        let monthStart = new Date(joinDate);
        monthStart.setDate(1);
        
        while (monthStart <= currentDate) {
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(0);
            
            const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
            let workingDays = daysInMonth;
            let salaryForMonth = staff.monthlySalary || 0;
            
            // First month pro-ration
            if (monthStart.getTime() === joinDate.getTime() || 
                (monthStart > joinDate && monthStart < new Date(joinDate.getFullYear(), joinDate.getMonth() + 1, 1))) {
                const joinDay = joinDate.getDate();
                workingDays = daysInMonth - joinDay + 1;
                salaryForMonth = (staff.monthlySalary / daysInMonth) * workingDays;
            }
            
            // Current month pro-ration
            const currentMonthStart = new Date();
            currentMonthStart.setDate(1);
            if (monthStart.getTime() === currentMonthStart.getTime()) {
                workingDays = currentDate.getDate();
                salaryForMonth = (staff.monthlySalary / daysInMonth) * workingDays;
            }
            
            totalEarnings += salaryForMonth;
            
            monthStart.setMonth(monthStart.getMonth() + 1);
        }
        
        // Get payments
        const payments = await findStaffSalaryPaymentService({ staffId });
        totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    }
    
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
        salaryType: staff.salaryType,
        percentage: staff.percentage,
        monthlySalary: staff.monthlySalary,
        joinDate: staff.joinDate,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalRemaining: Math.round(totalRemaining * 100) / 100,
        totalAdvance: Math.round(totalAdvance * 100) / 100,
        paymentStatus
    };
};

