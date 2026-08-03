import { connectDb } from "./configs/connect.db.js";
import { createUserService } from "./modules/auth/services/user.crud.js";
import bcrypt from "bcryptjs";
import { DEFAULT_PERMISSIONS } from "./common/constants/permissions.constant.js";

const seedAdmin = async () => {
    try {
        await connectDb();
        console.log("Database connected");

        const adminEmail = "admin@shop.com";
        const adminPassword = "admin123";

        // Check if admin already exists
        const UserModel = (await import("./configs/connect.db.js")).getLocalUserModel();
        const existingAdmin = await UserModel.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log("Admin user already exists");
            process.exit(0);
        }

        // Create admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const adminData = {
            name: "Admin",
            email: adminEmail,
            password: hashedPassword,
            phoneNo: "1234567890",
            role: "admin",
            permissions: DEFAULT_PERMISSIONS,
            language: "en",
            uploadSync: true,
            isActive: true,
        };

        const admin = await createUserService(adminData);
        console.log("Admin user created successfully:");
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log(`Role: admin`);

        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin:", error);
        process.exit(1);
    }
};

seedAdmin();
