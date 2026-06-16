import {
    createDoc,
    findDocs,
    findOneDoc,
    updateDoc,
    deleteOneDoc,
} from '../../../../shared/services/dbOperationService/local.dbOperation.service.js';

const ENTITY = 'member';

// Create a member — pass any valid member fields in `data`
export const createMember = (data) =>
    createDoc(ENTITY, data);

// Find many members — filter + options (sort, limit, skip, select, populate, lean)
export const findMembers = (filter = {}, options = {}) =>
    findDocs(ENTITY, filter, options);

// Find one member — filter + options (select, populate, lean)
export const findOneMember = (filter = {}, options = {}) =>
    findOneDoc(ENTITY, filter, options);

// Update one member — filter + updateData + options (upsert, etc.)
export const updateMember = (filter = {}, updateData = {}, options = {}) =>
    updateDoc(ENTITY, filter, updateData, options);

// Delete one member — filter + options
export const deleteMember = (filter = {}, options = {}) =>
    deleteOneDoc(ENTITY, filter, options);
