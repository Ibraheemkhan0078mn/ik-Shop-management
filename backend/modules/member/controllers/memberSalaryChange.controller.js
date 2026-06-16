import { getLocalMemberSalaryChangeModel, getLocalMemberModel } from '../../../configs/connect.db.js';
import { ApiError } from '../../../common/services/apiResponses.js';
import { changeTrackDocsCreationFunc } from '../../../common/ikSync/changeTrackModelCreation.js';

export const create = async (req, res) => {
    try {
        const Model = getLocalMemberSalaryChangeModel();
        const record = await Model.create(req.body);
        if (req.body.memberId) {
            await getLocalMemberModel().findOneAndUpdate(
                { _id: req.body.memberId },
                { $push: { salaryChangeRecord: record._id } }
            );
        }
        await changeTrackDocsCreationFunc('create', Model.modelName, record._id);
        return res.status(201).json({ success: true, msg: 'Salary change record created', data: record });
    } catch (err) {
        return ApiError(err, res);
    }
};

export const getAll = async (req, res) => {
    try {
        const records = await getLocalMemberSalaryChangeModel().find().sort({ date: -1 });
        return res.json({ success: true, data: records });
    } catch (err) {
        return ApiError(err, res);
    }
};

export const getOne = async (req, res) => {
    try {
        const record = await getLocalMemberSalaryChangeModel().findById(req.params.id);
        if (!record) return res.status(404).json({ success: false, msg: 'Record not found' });
        return res.json({ success: true, data: record });
    } catch (err) {
        return ApiError(err, res);
    }
};

export const update = async (req, res) => {
    try {
        const Model = getLocalMemberSalaryChangeModel();
        const record = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!record) return res.json({ success: false, msg: 'Record not found' });
        await changeTrackDocsCreationFunc('update', Model.modelName, record._id);
        return res.json({ success: true, msg: 'Salary change updated', data: record });
    } catch (err) {
        return ApiError(err, res);
    }
};

export const remove = async (req, res) => {
    try {
        const Model = getLocalMemberSalaryChangeModel();
        const record = await Model.findByIdAndDelete(req.params.id);
        if (!record) return res.status(404).json({ success: false, msg: 'Record not found' });
        await changeTrackDocsCreationFunc('delete', Model.modelName, record._id);
        return res.json({ success: true, msg: 'Salary change deleted' });
    } catch (err) {
        return ApiError(err, res);
    }
};

export const getByMemberId = async (req, res) => {
    try {
        const records = await getLocalMemberSalaryChangeModel().find({ memberId: req.params.id }).sort({ date: -1 });
        return res.json({ success: true, data: records });
    } catch (err) {
        return ApiError(err, res);
    }
};
