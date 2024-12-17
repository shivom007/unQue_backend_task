import prisma from "../db/db.config.js";
import { APPOINTMENT_STATUS } from "./appointmentStatus.js";

export const checkExistingAppointment = async (professorId, studentId, newStartTime, newEndTime) => {
    try {
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                professorId: professorId,
                studentId: studentId,
                status: APPOINTMENT_STATUS.PENDING,
                OR: [
                    {
                        // New start time falls within an existing appointment
                        startTime: { lte: newStartTime },
                        endTime: { gte: newStartTime },
                    },
                    {
                        // New end time falls within an existing appointment
                        startTime: { lte: newEndTime },
                        endTime: { gte: newEndTime },
                    },
                    {
                        // Existing appointment is fully encompassed by the new appointment
                        startTime: { gte: newStartTime },
                        endTime: { lte: newEndTime },
                    },
                    {
                        // New appointment is fully encompassed by an existing appointment
                        startTime: { lte: newStartTime },
                        endTime: { gte: newEndTime },
                    },
                ],
            },
        });

        return !!existingAppointment; // Return true if an appointment exists, false otherwise
    } catch (error) {
        console.error("Error checking existing appointment:", error);
        throw new Error("An error occurred while checking existing appointment.");
    }
};

