import {
    createDoc,
    findDocs,
    findOneDoc,
    updateDoc,
    deleteOneDoc,
} from '../../../../shared/services/dbOperationService/local.dbOperation.service.js';

const ENTITY = 'classPartnership';

export const createPartnership  = (data)                         => createDoc(ENTITY, data);
export const findPartnerships   = (filter = {}, options = {})    => findDocs(ENTITY, filter, options);
export const findOnePartnership = (filter = {}, options = {})    => findOneDoc(ENTITY, filter, options);
export const updatePartnership  = (filter, data, options = {})   => updateDoc(ENTITY, filter, data, options);
export const deletePartnership  = (filter, options = {})         => deleteOneDoc(ENTITY, filter, options);
