import {
    createDoc,
    findDocs,
    findOneDoc,
    updateDoc,
    deleteOneDoc,
} from '../../../../shared/services/dbOperationService/local.dbOperation.service.js';

const ENTITY = 'partnerInvestment';

export const createInvestment  = (data)                         => createDoc(ENTITY, data);
export const findInvestments   = (filter = {}, options = {})    => findDocs(ENTITY, filter, options);
export const findOneInvestment = (filter = {}, options = {})    => findOneDoc(ENTITY, filter, options);
export const updateInvestment  = (filter, data, options = {})   => updateDoc(ENTITY, filter, data, options);
export const deleteInvestment  = (filter, options = {})         => deleteOneDoc(ENTITY, filter, options);
