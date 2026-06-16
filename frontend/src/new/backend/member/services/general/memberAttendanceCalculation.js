import * as localDb from "../../../../shared/services/dbOperationService/local.dbOperation.service.js";
import { getCurrentMonthRange } from "../../../../shared/utils/date.utility.js";

export async function memberAttendenceCalcFunc(fromDate, tillDate, memberDocId) {
  try {
    let totalClasses = 0;
    let presence = 0;
    let absence = 0;
    let leave = 0;
    let presencePercentage = 0;

    if (!fromDate || !tillDate) {
      return { success: false, msg: "date is not found" };
    }

    const { startOfMonth, endOfMonth } = getCurrentMonthRange(fromDate, tillDate);

    const attendenceDocs = await localDb.findDocs("memberAttendence", {
      date: { $gte: startOfMonth, $lte: endOfMonth },
      "members.id": memberDocId,
    });

    if (!attendenceDocs?.length > 0) {
      return { success: false, msg: "No attendence is found" };
    }

    for (const eachAttendenceDocs of attendenceDocs) {
      for (const eachMember of eachAttendenceDocs.members) {
        if (memberDocId.toString() == eachMember?.id.toString()) {
          if (eachMember?.presenceStatus == "present") presence++;
          else if (eachMember?.presenceStatus == "absent") absence++;
          else if (eachMember?.presenceStatus == "leave") leave++;
          else if (eachMember?.presenceStatus == "notFilled") absence++;
        }
      }
    }

    totalClasses = attendenceDocs?.length;
    presencePercentage = (presence / totalClasses) * 100;

    return { totalClasses, presence, absence, leave, presencePercentage, attendenceDocs };
  } catch (error) {
    console.error(error);
  }
}
