import {
    createDoc,
    findDocs,
    findOneDoc,
    updateDoc,
    deleteOneDoc,
} from '../../../../shared/services/dbOperationService/local.dbOperation.service.js';

const ENTITY = 'memberSalaryChange';

export const createSalaryChange  = (data)                         => createDoc(ENTITY, data);
export const findSalaryChanges   = (filter = {}, options = {})    => findDocs(ENTITY, filter, options);
export const findOneSalaryChange = (filter = {}, options = {})    => findOneDoc(ENTITY, filter, options);
export const updateSalaryChange  = (filter, data, options = {})   => updateDoc(ENTITY, filter, data, options);
export const deleteSalaryChange  = (filter, options = {})         => deleteOneDoc(ENTITY, filter, options);
