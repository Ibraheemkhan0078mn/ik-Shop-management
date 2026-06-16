import {
    createSalaryChange,
    findSalaryChanges,
    findOneSalaryChange,
    updateSalaryChange,
    deleteSalaryChange,
} from '../crud/memberSalaryChange.crud.service.js';

export const createPayment        = (data)            => createSalaryChange(data);
export const getAllPayments        = ()                => findSalaryChanges();
export const getPaymentById       = (id)              => findOneSalaryChange({ _id: id });
export const updatePayment        = (id, data)        => updateSalaryChange({ _id: id }, data);
export const deletePayment        = (id)              => deleteSalaryChange({ _id: id });
export const getPaymentOnCondition = (filter = {})    => findSalaryChanges(filter);
