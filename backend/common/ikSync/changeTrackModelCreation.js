

import mongoose from "mongoose";
import { getLocalActivityLogModel, getLocalChangeTrackModel } from "../../configs/connect.db.js";






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


  } catch (error) {
    console.log(error);
  }
}