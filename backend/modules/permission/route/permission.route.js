import express from 'express'
const router = express.Router()
import { ApiError } from '../../../common/services/apiResponses.js'
import { DEFAULT_PERMISSIONS } from '../../../common/constants/permissions.constant.js'









router.get("/getDefaultPermissions", async (req, res) => {
    try {
        return res.json({ success: true, permissions: DEFAULT_PERMISSIONS })

    } catch (error) {
        return ApiError(error, res)
    }
})





export default router