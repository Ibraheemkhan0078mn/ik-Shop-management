import {
    getLocalStaffModel,
    getLocalStaffSalaryPaymentModel,
    getLocalStaffSaleBillModel,
    getLocalOrderModel,
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

export const addDocumentToStaff = async (staffId, documentData) => {
    const StaffModel = getLocalStaffModel();
    const staff = await StaffModel.findByIdAndUpdate(
        staffId,
        { $push: { documents: documentData } },
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

// Staff Sale Bill operations
export const createSaleBill = async (billData) => {
    const StaffSaleBillModel = getLocalStaffSaleBillModel();
    const bill = await StaffSaleBillModel.create(billData);
    return bill;
};

export const getSaleBillsByStaff = async (staffId, filters = {}) => {
    const StaffSaleBillModel = getLocalStaffSaleBillModel();
    const { page = 1, limit = 20 } = filters;
    
    const matchQuery = { staffId };
    
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
        StaffSaleBillModel.find(matchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('posOrderId'),
        StaffSaleBillModel.countDocuments(matchQuery)
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
