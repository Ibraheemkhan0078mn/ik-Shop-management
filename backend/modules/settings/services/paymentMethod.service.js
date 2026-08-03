import {
    createPaymentMethodService,
    findPaymentMethodService,
    findOnePaymentMethodService,
    findByIdPaymentMethodService,
    updatePaymentMethodService,
    deleteOnePaymentMethodService,
    countPaymentMethodService,
} from "./paymentMethod.crud.js";

export const getAllPaymentMethods = async () => {
    const paymentMethods = await findPaymentMethodService();
    return paymentMethods.sort((a, b) => a.name.localeCompare(b.name));
};

export const getPaymentMethodById = async (id) => {
    return findByIdPaymentMethodService(id);
};

export const createPaymentMethod = async (data) => {
    const { name } = data;

    if (!name || name.trim() === "") {
        throw new Error("Payment method name is required");
    }

    const existingMethod = await findOnePaymentMethodService({ name: name.trim() });
    if (existingMethod) {
        throw new Error("Payment method with this name already exists");
    }

    return createPaymentMethodService({
        name: name.trim(),
        isActive: true
    });
};

export const updatePaymentMethod = async (id, data) => {
    const { name, isActive } = data;

    if (!name || name.trim() === "") {
        throw new Error("Payment method name is required");
    }

    const paymentMethod = await findByIdPaymentMethodService(id);
    if (!paymentMethod) {
        throw new Error("Payment method not found");
    }

    const existingMethod = await findOnePaymentMethodService({ 
        name: name.trim(),
        _id: { $ne: id }
    });
    if (existingMethod) {
        throw new Error("Payment method with this name already exists");
    }

    const updateData = { name: name.trim() };
    if (typeof isActive === "boolean") {
        updateData.isActive = isActive;
    }

    return updatePaymentMethodService(id, updateData);
};

export const deletePaymentMethod = async (id) => {
    const paymentMethod = await findByIdPaymentMethodService(id);
    if (!paymentMethod) {
        throw new Error("Payment method not found");
    }

    return deleteOnePaymentMethodService(id);
};
