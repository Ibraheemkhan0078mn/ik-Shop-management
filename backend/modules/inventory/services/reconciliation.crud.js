import { getLocalProductModel, getLocalBatchModel } from "../../../configs/connect.db.js";

// Get models for reconciliation operations
export const getProductModel = () => getLocalProductModel();
export const getBatchModel = () => getLocalBatchModel();
