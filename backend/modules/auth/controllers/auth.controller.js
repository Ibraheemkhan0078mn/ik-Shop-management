import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    userCreate as userCreateService,
    findUserByEmail as findUserByEmailService,
    findUserByEmailWithPassword as findUserByEmailWithPasswordService,
    findUserByIdWithoutPassword as findUserByIdWithoutPasswordService,
} from "../services/auth.service.js";
import {
    findOnlineUserByEmail as findOnlineUserByEmailService,
    findOnlineUserByEmailWithPassword as findOnlineUserByEmailWithPasswordService,
    onlineUserCreate as onlineUserCreateService,
} from "../services/onlineAuth.service.js";
import { getOnlineDbInstance } from "../../../configs/onlineConnect.db.js";
import { getLocalUserModel } from "../../../configs/connect.db.js";

export const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return next(new ErrorResponse("Email and password are required", 400));
    }

    // Step 1: Check local DB first via main services
    let user = await findUserByEmailService(email);
    let userWithPassword = null;
    let isFromOnline = false;

    if (user) {
        // User found in local DB, get user with password for verification
        userWithPassword = await findUserByEmailWithPasswordService(email);
        
        if (!userWithPassword) {
            return next(new ErrorResponse("Error fetching user data from local database", 500));
        }

        const isMatch = await userWithPassword.comparePassword(password);

        if (!isMatch) {
            return next(new ErrorResponse("Incorrect password", 401));
        }

        if (!user.isActive) {
            return next(new ErrorResponse("This account has been deactivated", 403));
        }

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                phoneNo: user.phoneNo,
                role: user.role,
                permissions: user.permissions || [],
            },
        });
    }

    // Step 2: User not found in local DB, check online DB connection
    const onlineDb = getOnlineDbInstance();
    if (!onlineDb || onlineDb.readyState !== 1) {
        return next(new ErrorResponse("User not found locally. Please connect to the online database to login.", 401));
    }

    // Step 3: Online DB is connected, try login from online DB
    try {
        const onlineUser = await findOnlineUserByEmailWithPasswordService(email);
        
        if (!onlineUser) {
            return next(new ErrorResponse("No user found with this email address. Please check your credentials or contact admin.", 401));
        }

        const isMatch = await onlineUser.comparePassword(password);

        if (!isMatch) {
            return next(new ErrorResponse("Incorrect password", 401));
        }

        if (!onlineUser.isActive) {
            return next(new ErrorResponse("This account has been deactivated", 403));
        }

        // Step 4: Store online user data in local DB (include password as it's required by schema)
        const userDataToStore = onlineUser.toObject ? onlineUser.toObject() : onlineUser;
        const localUser = await userCreateService(userDataToStore);
        
        isFromOnline = true;

        return res.status(200).json({
            success: true,
            message: "User logged in successfully (synced from online)",
            data: {
                id: localUser._id,
                name: localUser.name,
                email: localUser.email,
                phoneNo: localUser.phoneNo,
                role: localUser.role,
                permissions: localUser.permissions || [],
            },
        });
    } catch (onlineError) {
        console.error("Online DB error during login:", onlineError.message);
        return next(new ErrorResponse("Error accessing online database. Please try again later.", 500));
    }
});

export const registerUser = asyncHandler(async (req, res, next) => {
    const validatedData = req.body || {};
    const { email, password, confirmPassword, role } = validatedData;

    if (password !== confirmPassword) { 
        return next(new ErrorResponse("Passwords do not match", 400));
    }
 
    // Check if user already exists locally
    const userExists = await findUserByEmailService(email);
    if (userExists) {
        return next(
            new ErrorResponse("User already exists with this email", 400),
        );
    }

    // Only allow admin registration
    if (role !== 'admin') {
        return next(new ErrorResponse("Registration is restricted to admin role only. Contact existing admin for account creation.", 400));
    }

    // Check if an admin already exists locally
    const LocalUserModel = getLocalUserModel();
    const existingAdmin = await LocalUserModel.findOne({ role: 'admin' });
    if (existingAdmin) {
        return next(new ErrorResponse("An admin account already exists. Only one admin is allowed.", 400));
    }

    // Also check online DB for existing admin using service
    try {
        const onlineDb = getOnlineDbInstance();
        if (onlineDb && onlineDb.readyState === 1) {
            const existingOnlineAdmin = await findOnlineUserByEmailService(email);
            if (existingOnlineAdmin && existingOnlineAdmin.role === 'admin') {
                return next(new ErrorResponse("An admin account already exists in the system. Only one admin is allowed.", 400));
            }
        }
    } catch (onlineError) {
        console.error("Online DB check during registration:", onlineError.message);
        // Continue with local registration if online check fails
    }
  
    const { confirmPassword: _, ...userData } = validatedData;
    const user = await userCreateService(userData);

    // Try to sync to online DB if connected using service
    try {
        const onlineDb = getOnlineDbInstance();
        if (onlineDb && onlineDb.readyState === 1) {
            await onlineUserCreateService(userData);
        }
    } catch (onlineError) {
        console.error("Failed to sync user to online DB:", onlineError.message);
        // Registration succeeded locally, just log the error
    }

    res.status(201).json({
        success: true,
        message: "Admin registered successfully",
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            phoneNo: user.phoneNo,
            role: user.role,
            permissions: user.permissions || [],
        },
    });
});

export const getMe = asyncHandler(async (req, res, next) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(200).json({
            success: false,
            message: "User ID is required",
            data: null,
        });
    }

    const user = await findUserByIdWithoutPasswordService(userId);

    if (!user) {
        return res.status(200).json({
            success: false,
            message: "User not found",
            data: null,
        });
    }

    res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: user,
    });
});

export const logoutUser = asyncHandler(async (req, res, next) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                return next(new ErrorResponse("Failed to logout", 500));
            }

            res.clearCookie("connect.sid");

            res.status(200).json({
                success: true,
                message: "User logged out successfully",
                data: {},
            });
        });
    } else {
        // No session to destroy, just clear cookie and return success
        res.clearCookie("connect.sid");

        res.status(200).json({
            success: true,
            message: "User logged out successfully",
            data: {},
        });
    }
});

export const checkAdminRegistrationAllowed = asyncHandler(async (req, res, next) => {
    try {
        const LocalUserModel = getLocalUserModel();
        const existingAdmin = await LocalUserModel.findOne({ role: 'admin' });
        
        if (existingAdmin) {
            return res.status(200).json({
                success: false,
                allowed: false,
                message: "An admin account already exists",
            });
        }

        // Also check online DB using service
        try {
            const onlineDb = getOnlineDbInstance();
            if (onlineDb && onlineDb.readyState === 1) {
                const existingOnlineAdmin = await findOnlineUserByEmailService('admin');
                if (existingOnlineAdmin && existingOnlineAdmin.role === 'admin') {
                    return res.status(200).json({
                        success: false,
                        allowed: false,
                        message: "An admin account already exists in the system",
                    });
                }
            }
        } catch (onlineError) {
            console.error("Online DB check during admin registration check:", onlineError.message);
        }

        res.status(200).json({
            success: true,
            allowed: true,
            message: "Admin registration is allowed",
        });
    } catch (error) {
        console.error("Error checking admin registration:", error.message);
        res.status(500).json({
            success: false,
            allowed: false,
            message: "Error checking registration status",
        });
    }
});
