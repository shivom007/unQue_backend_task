import express from "express";

import { createAppointment, getAppointments, approveAppointment, deleteAppointment, cancelAppointment } from "../controllers/appointmentController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.post("/create", authenticate, createAppointment);

router.get("/all", authenticate, getAppointments);
// Approve an appointment (Authenticated, Only professors can approve)
router.patch("/approve/:id", authenticate, approveAppointment);

// Delete an appointment (Authenticated, Only students can delete)
router.delete("/delete/:id", authenticate, deleteAppointment);

// Cancel an appointment (Authenticated)
router.patch("/cancel/:id", authenticate, cancelAppointment);

export default router;

