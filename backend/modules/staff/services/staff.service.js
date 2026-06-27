import mongoose from "mongoose";
import {
    getLocalStaffModel,
    getLocalStaffSalaryPaymentModel,
    getLocalStaffSaleBillModel,
    getLocalOrderModel,
    getLocalStaffAttendanceModel,
} from "../../../configs/connect.db.js";

// Create staff sale bill from POS order
export const createStaffSaleBillFromPOS = async (staffId, posOrder) => {
    const StaffModel = getLocalStaffModel();
    const StaffSaleBillModel = getLocalStaffSaleBillModel();
    
    // Fetch the staff
    const staff = await StaffModel.findById(staffId);
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
    const staffSaleBill = await StaffSaleBillModel.create({
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
    const StaffModel = getLocalStaffModel();
    const staff = await StaffModel.create(staffData);
    return staff;
};

export const getAllStaff = async (filters = {}) => {
    const StaffModel = getLocalStaffModel();
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
        StaffModel.find(matchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        StaffModel.countDocuments(matchQuery)
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
    const StaffModel = getLocalStaffModel();
    const staff = await StaffModel.findById(staffId);
    if (!staff) {
        throw new Error('Staff not found');
    }
    return staff;
};

export const updateStaff = async (staffId, updateData) => {
    const StaffModel = getLocalStaffModel();
    const staff = await StaffModel.findByIdAndUpdate(
        staffId,
        updateData,
        { new: true, runValidators: true }
    );
    if (!staff) {
        throw new Error('Staff not found');
    }
    return staff;
};

export const deleteStaff = async (staffId) => {
    const StaffModel = getLocalStaffModel();
    const staff = await StaffModel.findByIdAndDelete(staffId);
    if (!staff) {
        throw new Error('Staff not found');
    }
    return staff;
};

export const addDocumentToStaff = async (staffId, imageData) => {
    const StaffModel = getLocalStaffModel();
    const staff = await StaffModel.findByIdAndUpdate(
        staffId,
        { $push: { documents: { $each: imageData } } },
        { new: true }
    );
    if (!staff) {
        throw new Error('Staff not found');
    }
    return staff;
};

export const removeDocumentFromStaff = async (staffId, documentId) => {
    const StaffModel = getLocalStaffModel();
    const staff = await StaffModel.findByIdAndUpdate(
        staffId,
        { $pull: { documents: { _id: documentId } } },
        { new: true }
    );
    if (!staff) {
        throw new Error('Staff not found');
    }
    return staff;
};

// Staff Salary Payment operations
export const createSalaryPayment = async (paymentData) => {
    const StaffSalaryPaymentModel = getLocalStaffSalaryPaymentModel();
    const payment = await StaffSalaryPaymentModel.create(paymentData);
    return payment;
};

export const getSalaryPaymentsByStaff = async (staffId, filters = {}) => {
    const StaffSalaryPaymentModel = getLocalStaffSalaryPaymentModel();
    const { page = 1, limit = 20 } = filters;
    
    const matchQuery = { staffId };
    
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
        StaffSalaryPaymentModel.find(matchQuery)
            .sort({ paidAt: -1 })
            .skip(skip)
            .limit(limit),
        StaffSalaryPaymentModel.countDocuments(matchQuery)
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
    const StaffSalaryPaymentModel = getLocalStaffSalaryPaymentModel();
    const payment = await StaffSalaryPaymentModel.findByIdAndDelete(paymentId);
    if (!payment) {
        throw new Error('Salary payment not found');
    }
    return payment;
};

// Staff Sale Bill operations
export const createSaleBill = async (billData) => {
    const StaffSaleBillModel = getLocalStaffSaleBillModel();
    const bill = await StaffSaleBillModel.create(billData);
    return bill;
};

export const getSaleBillsByStaff = async (staffId, filters = {}) => {
    const OrderModel = getLocalOrderModel();
    const { page = 1, limit = 20 } = filters;
    
    const matchQuery = { 
        staffId,
        isPosOrder: true,
        status: 'completed'
    };
    
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
        OrderModel.find(matchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('items.product'),
        OrderModel.countDocuments(matchQuery)
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
    const StaffSaleBillModel = getLocalStaffSaleBillModel();
    const bill = await StaffSaleBillModel.findByIdAndUpdate(
        billId,
        { isPaid: true, paidAt: new Date() },
        { new: true }
    );
    if (!bill) {
        throw new Error('Sale bill not found');
    }
    return bill;
};

// Staff Attendance operations
export const getAttendanceByDate = async (date) => {
    const StaffAttendanceModel = getLocalStaffAttendanceModel();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await StaffAttendanceModel.findOne({
        date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('attendance.staff');

    return attendance;
};

export const createOrUpdateAttendance = async (date, attendanceData, userId) => {
    const StaffAttendanceModel = getLocalStaffAttendanceModel();
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

    let attendance = await StaffAttendanceModel.findOne({
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
        await attendance.save();
    } else {
        // Create new attendance record
        console.log('Creating new attendance record with:', {
            date: startOfDay,
            staffId: staffObjectId,
            status: attendanceData.status,
            lateHours: attendanceData.lateHours
        });
        
        const newAttendance = new StaffAttendanceModel({
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
        
        attendance = await newAttendance.save();
    }

    return attendance;
};

export const getAttendanceHistory = async (filters = {}) => {
    const StaffAttendanceModel = getLocalStaffAttendanceModel();
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
        StaffAttendanceModel.find(matchQuery)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .populate('attendance.staff')
            .populate('createdBy', 'fullName'),
        StaffAttendanceModel.countDocuments(matchQuery)
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
    const staff = await StaffModel.find({ status: 'active' }).sort({ fullName: 1 });
    return staff;
};

