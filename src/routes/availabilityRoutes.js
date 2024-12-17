import express from "express";
import { createAvailability, getAvailability } from "../controllers/availabilityController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.post("/create", authenticate, createAvailability);
router.get("/:professorId", authenticate, getAvailability);

export default router;