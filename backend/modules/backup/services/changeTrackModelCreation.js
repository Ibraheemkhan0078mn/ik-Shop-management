

import mongoose from "mongoose";
import {
  getLocalActivityLogModel,
  getLocalChangeTrackModel,
  getLocalUserModel,
  getLocalUserRoleModel,
  getLocalProductModel,
  getLocalCategoryModel,
  getLocalSubCategoryModel,
  getLocalBrandModel,
  getLocalBatchModel,
  getLocalSupplierModel,
  getLocalPurchaseModel,
  getLocalPurchasePaymentModel,
  getLocalOrderModel,
  getLocalHoldOrderModel,
  getLocalExpensesModel,
  getLocalExpenseCategoryModel,
  getLocalImageChangeTrackModel,
  getLocalQarzaAccountModel,
  getLocalQarzaPaymentModel,
  getLocalWastageModel,
  getLocalPurchaseReturnModel,
  getLocalProductReturnModel,
  getLocalCustomerModel,
  getLocalStaffModel,
  getLocalStaffRoleModel,
  getLocalStaffSalaryPaymentModel,
  getLocalStaffSaleBillModel,
  getLocalStaffAttendanceModel,
  getLocalSettingsModel,
  getLocalPaymentMethodModel,
  getLocalAppThemeModel,
  getLocalTransactionModel,
} from "../../../configs/connect.db.js";
import { getOnlineDbInstance } from "../../../configs/onlineConnect.db.js";

const localModelGetters = {
  Users: () => getLocalUserModel(),
  UserRoles: () => getLocalUserRoleModel(),
  Products: () => getLocalProductModel(),
  Categories: () => getLocalCategoryModel(),
  SubCategories: () => getLocalSubCategoryModel(),
  Brands: () => getLocalBrandModel(),
  Batches: () => getLocalBatchModel(),
  Suppliers: () => getLocalSupplierModel(),
  Purchases: () => getLocalPurchaseModel(),
  PurchasePayments: () => getLocalPurchasePaymentModel(),
  Orders: () => getLocalOrderModel(),
  HoldOrders: () => getLocalHoldOrderModel(),
  Expenses: () => getLocalExpensesModel(),
  ExpensesCategory: () => getLocalExpenseCategoryModel(),
  ActivityLogs: () => getLocalActivityLogModel(),
  ImageChangeTracks: () => getLocalImageChangeTrackModel(),
  QarzaAccount: () => getLocalQarzaAccountModel(),
  QarzaPayment: () => getLocalQarzaPaymentModel(),
  Wastages: () => getLocalWastageModel(),
  PurchaseReturn: () => getLocalPurchaseReturnModel(),
  ProductReturn: () => getLocalProductReturnModel(),
  Customers: () => getLocalCustomerModel(),
  Staff: () => getLocalStaffModel(),
  StaffRole: () => getLocalStaffRoleModel(),
  StaffSalaryPayment: () => getLocalStaffSalaryPaymentModel(),
  StaffSaleBill: () => getLocalStaffSaleBillModel(),
  StaffAttendance: () => getLocalStaffAttendanceModel(),
  Settings: () => getLocalSettingsModel(),
  PaymentMethods: () => getLocalPaymentMethodModel(),
  AppThemes: () => getLocalAppThemeModel(),
  Transactions: () => getLocalTransactionModel(),
};

const onlineModelNames = {
  StaffRole: "StaffRoles",
};

export async function liveUpload(operation, modelName, documentId) {
  const onlineDbInstance = getOnlineDbInstance();
  if (!onlineDbInstance || onlineDbInstance.readyState !== 1) {
    return false;
  }

  const getLocalModel = localModelGetters[modelName];
  const onlineModel = onlineDbInstance.models[onlineModelNames[modelName] || modelName];
  if (!getLocalModel || !onlineModel) {
    return false;
  }

  const localModel = getLocalModel();
  const localDocument = await localModel?.findById(documentId);

  if (operation === "delete") {
    await onlineModel.deleteOne({ _id: documentId });
  } else {
    if (!localDocument) {
      return false;
    }

    const documentData = localDocument.toObject();
    delete documentData._id;

    if (operation !== "create" && operation !== "update") {
      return false;
    }

    await onlineModel.findOneAndUpdate(
      { _id: documentId },
      { $set: documentData },
      { upsert: true, returnDocument: "after" },
    );
  }

  const localChangeTrackModel = getLocalChangeTrackModel();
  await localChangeTrackModel.deleteMany({
    documentId: documentId.toString(),
    modelName,
    operationType: operation,
  });

  console.log(`[liveUpload] Synced and cleared local change track for ${operation} ${modelName}:${documentId}`);
  return true;
}






function buildDescription(operation, modelName, documentId, operatedBy) {
  const ops = {
    create: `A new document was created in [${modelName}] (${operatedBy})`,
    update: `Document  in [${modelName}] was updated (${operatedBy})`,
    delete: `Document  in [${modelName}] was permanently deleted (${operatedBy})`,
  };
  return ops[operation] ?? `Operation "${operation}" performed on [${modelName}] — Document ID: ${documentId}`;
}





export async function changeTrackDocsCreationFunc(
  operation = "update",
  modelName,
  documentId
) {
  try {

    if (!operation || !modelName || !documentId) {
      return;
    }

    let ChangeTrackModel = getLocalChangeTrackModel();

    let createdChangeTrackDocs = await ChangeTrackModel.create({
      documentId,
      operationType: operation,
      modelName,
    });


    // IF UPDATE OPERATION:
    // - Agar is document ka "create" CT already exist kare → naya update CT delete karo (create sufficient hai)
    // - Agar "create" nahi hai → naya update CT rakho, baaki saare purane update CTs delete karo
    if (operation == "update") {
      const existingCreateCT = await ChangeTrackModel.findOne({
        documentId,
        modelName,
        operationType: "create",
      });

      if (existingCreateCT) {
        // Create already mojod hai, update CT ki zaroorat nahi
        await ChangeTrackModel.deleteOne({ _id: createdChangeTrackDocs._id });
      } else {
        // Create nahi hai → naya update rakho, baaki saare purane update delete karo
        const allUpdateSimilarDocs = await ChangeTrackModel.find({
          documentId,
          modelName,
          operationType: "update",
        });
        if (allUpdateSimilarDocs?.length > 1) {
          const toDeleteCTIds = allUpdateSimilarDocs
            .filter((d) => !(d?._id?.toString() == createdChangeTrackDocs?._id?.toString()))
            .map((d) => d._id);
          await ChangeTrackModel.deleteMany({ _id: { $in: toDeleteCTIds } });
        }
      }
    }


    // IF DELETE OPERATION:
    // - Agar is document ka "create" CT exist kare → saare CTs delete karo (naya delete CT bhi)
    // - Agar "create" nahi hai → saare "update" CTs delete karo, sirf naya "delete" CT rakho
    if (operation == "delete") {
      const localCTModel = getLocalChangeTrackModel();

      const existingCreateCT = await localCTModel.findOne({
        documentId,
        modelName,
        operationType: "create",
      });

      if (existingCreateCT) {
        // Create mojod hai → saare CTs delete karo (delete CT bhi, sync ki zaroorat nahi)
        const allDocsForDocument = await localCTModel.find({ documentId });
        await localCTModel.deleteMany({
          _id: { $in: allDocsForDocument.map((d) => d._id) },
        });
      } else {
        // Create nahi hai → sirf update CTs delete karo, delete CT rakho
        const allUpdateCTs = await localCTModel.find({
          documentId,
          operationType: "update",
        });
        if (allUpdateCTs?.length > 0) {
          await localCTModel.deleteMany({
            _id: { $in: allUpdateCTs.map((d) => d._id) },
          });
        }
      }
    }


    // ── Activity log ────────────────────────────────────────────────────────
    try {
      const ActivityLogModel = getLocalActivityLogModel();
      if (ActivityLogModel) {

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const fiveSecondsAgo = new Date(Date.now() - 5 * 1000);

        // duplicate check — same doc + same action in last 5 minutes
        const existingLog = await ActivityLogModel.findOne({
          action: operation.toLowerCase(),
          documentId: documentId,
          model: modelName,
          date: { $gte: fiveMinutesAgo },
        });

        if (!existingLog) {

          // check if ANY other different document was also changed in last 5 seconds
          const recentOtherLog = await ActivityLogModel.findOne({
            documentId: { $ne: documentId },  // different document
            date: { $gte: fiveSecondsAgo },
          });

          const changedBy = recentOtherLog ? "EDC AI" : "human";

          await ActivityLogModel.create({
            action: operation.toLowerCase(),
            documentId: documentId,
            model: modelName,
            description: buildDescription(operation, modelName, documentId, changedBy),
            changedBy: changedBy,
          });

        }

      }
    } catch (logErr) {
      console.log("Error while creating activity log: ", logErr);
    }
    // ────────────────────────────────────────────────────────────────────────

    liveUpload(operation, modelName, documentId).catch((syncErr) => {
      console.log("Error while uploading live change to online DB: ", syncErr);
    });


  } catch (error) {
    console.log(error);
  }
}