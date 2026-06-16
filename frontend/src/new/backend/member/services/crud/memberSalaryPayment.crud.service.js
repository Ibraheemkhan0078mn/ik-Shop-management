import {
    createDoc,
    findDocs,
    findOneDoc,
    updateDoc,
    deleteOneDoc,
} from '../../../../shared/services/dbOperationService/local.dbOperation.service.js';

const ENTITY = 'memberSalaryPayment';

export const createSalaryPayment  = (data)                         => createDoc(ENTITY, data);
export const findSalaryPayments   = (filter = {}, options = {})    => findDocs(ENTITY, filter, options);
export const findOneSalaryPayment = (filter = {}, options = {})    => findOneDoc(ENTITY, filter, options);
export const updateSalaryPayment  = (filter, data, options = {})   => updateDoc(ENTITY, filter, data, options);
export const deleteSalaryPayment  = (filter, options = {})         => deleteOneDoc(ENTITY, filter, options);
