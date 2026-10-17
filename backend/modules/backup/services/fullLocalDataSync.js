import mongoose from "mongoose";

const LOCAL_MONGODB_URI = "mongodb://127.0.0.1:27017";
const LOCAL_DATABASE_NAME = "Shop-management-new";

export async function fullLocalDataSync(modelsArray) {
  let localConnection;

  try {
    localConnection = await mongoose
      .createConnection(LOCAL_MONGODB_URI, { dbName: LOCAL_DATABASE_NAME })
      .asPromise();

    let totalSynced = 0;

    for (const eachModel of modelsArray) {
      const onlineModel = eachModel.online;
      if (!onlineModel) {
        throw new Error(`Online model is not initialized for ${eachModel.local?.modelName || "unknown model"}`);
      }

      const localModel = localConnection.model(
        onlineModel.modelName,
        onlineModel.schema,
        onlineModel.collection.collectionName
      );
      let collectionSynced = 0;

      for await (const document of localModel.collection.find({})) {
        await onlineModel.collection.replaceOne(
          { _id: document._id },
          document,
          { upsert: true }
        );
        collectionSynced += 1;
      }

      totalSynced += collectionSynced;
      console.log(`Synced ${collectionSynced} documents from ${onlineModel.modelName}`);
    }

    return { success: true, totalSynced };
  } finally {
    if (localConnection) {
      await localConnection.close();
    }
  }
}