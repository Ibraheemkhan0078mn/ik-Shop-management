import {
    createDoc,
    findDocs,
    findOneDoc,
    updateDoc,
    deleteOneDoc,
} from '../../../../shared/services/dbOperationService/local.dbOperation.service.js';

const ENTITY = 'memberAttendence';

export const createAttendance = (data) => createDoc(ENTITY, data);
export const findAttendances = (filter = {}, options = {}) => findDocs(ENTITY, filter, options);
export const findOneAttendance = (filter = {}, options = {}) => findOneDoc(ENTITY, filter, options);
export const updateAttendance = (filter, data, options = {}) => updateDoc(ENTITY, filter, data, options);
export const deleteAttendance = (filter, options = {}) => deleteOneDoc(ENTITY, filter, options);
