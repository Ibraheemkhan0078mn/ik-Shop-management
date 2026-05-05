import { getLocalMemberModel, getLocalMemberInvestmentModel } from "../../../configs/connect.db.js";
import { changeTrackDocsCreationFunc } from "../../../common/ikSync/changeTrackModelCreation.js";



export async function partnerInvestmentCreationFuntion(values) {
    try {
        let {
            name,
            partnerId,
            amount,
            date,
            notes,
            paymentMethod,
            usedIn
        } = values;

        // Validate required fields
        if (!name || !partnerId || !amount) {
            return ({
                success: false,
                msg: "Name, partnerId, and amount are required fields"
            })
        }

        // Get teacher model and validate partner exists
        let localTeacherModel = getLocalMemberModel();
        let teacher = await localTeacherModel.findById(partnerId);

        if (!teacher) {
            return ({
                success: false,
                msg: "Teacher/Partner not found with provided partnerId"
            });
        }
        console.log("THe new teacher partner check", teacher.isPartner)

        // Validate if teacher is actually a partner
        if (!teacher.isPartner) {
            return ({
                success: false,
                msg: "The provided teacher is not registered as a partner"
            });
        }

        // Get partner investment model
        let localPartnerInvestmentModel = getLocalMemberInvestmentModel();

        // Create investment
        let createdInvestment = await localPartnerInvestmentModel.create({
            name,
            partnerId,
            amount: Number(amount),
            date: date ? new Date(date) : new Date(),
            notes,
            paymentMethod,
            usedIn
        });

        // Add investment to teacher's investments array
        if (createdInvestment) {
            if (!teacher.investmentMoney) {
                teacher.investmentMoney = [];
            }
            teacher.investmentMoney.push(createdInvestment._id);
            await teacher.save();
        }

        // Track changes
        await changeTrackDocsCreationFunc("create", localPartnerInvestmentModel.modelName, createdInvestment?._id);

        return ({
            success: true,
            msg: "Partner investment created successfully",
            createdInvestment
        });

    } catch (error) {
        return ({ success: false, msg: "The Partner investment is not created." })
    }
}



















