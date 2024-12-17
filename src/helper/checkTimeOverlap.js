import prisma from "../db/db.config.js";

// Function to check if a new time slot overlaps with existing availability
export const checkTimeOverlap = async (professorId, newStartTime, newEndTime) => {
    // Validate input parameters
    if (!professorId || !newStartTime || !newEndTime) {
        throw new Error("Invalid input: professorId, newStartTime, and newEndTime are required.");
    }
    if (newStartTime >= newEndTime) {
        throw new Error("Invalid input: newStartTime must be earlier than newEndTime.");
    }

    try {
        // Query database for overlapping time slots
        const overlapTiming = await prisma.availability.findFirst({
            where: {
                professorId: professorId,
                startTime: { lt: newEndTime }, // Existing slot starts before the new slot ends
                endTime: { gt: newStartTime }, // Existing slot ends after the new slot starts
            },
        });

        // Return true if overlap exists, otherwise false
        return !!overlapTiming;
    } catch (error) {
        console.error("Error querying database:", error);
        throw new Error("An error occurred while checking time overlap.");
    }
};
