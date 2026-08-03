import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { getLocalUserModel } from "../../../configs/connect.db.js";

export const protect = asyncHandler(async (req, res, next) => {
    // if (!req.session.userId) {
    //     return next(
    //         new ErrorResponse("Not authorized to access this route", 401),
    //     );
    // }

    // const UserModel = getLocalUserModel();
    // const user = await UserModel.findById(req.session.userId);

    // if (!user) {
    //     return next(new ErrorResponse("User no longer exists", 401));
    // }

    // req.user = user;
    next();
});

export const authorize = (...roles) => {
    return (req, res, next) => {
        // if (!roles.includes(req.user.role)) {
        //     return next(
        //         new ErrorResponse(
        //             `User role ${req.user.role} is not authorized to access this route`,
        //             403,
        //         ),
        //     );
        // }
        next();
    };
};
