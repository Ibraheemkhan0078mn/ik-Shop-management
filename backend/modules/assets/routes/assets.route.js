import express from "express";
import {
    getAllInventory,
    createInventory,
    updateInventory,
    deleteInventory,
    getAllInventoryCategories,
    createInventoryCategory,
    updateInventoryCategory,
    deleteInventoryCategory,
} from "../controllers/inventory.controller.js";


const route = express.Router();

route.post("/getAllInventory/:skip/:limit", getAllInventory);
route.post("/inventoryCreate", createInventory);
route.put("/inventoryUpdate/:id", updateInventory);
route.delete("/inventoryDelete/:id", deleteInventory);






route.get("/getAllInventoryCatagory", getAllInventoryCategories);
route.post("/inventoryCatagCreate", createInventoryCategory);
route.put("/inventoryCatagUpdate/:id", updateInventoryCategory);
route.delete("/inventoryCatagDelete/:id", deleteInventoryCategory);





export default route;