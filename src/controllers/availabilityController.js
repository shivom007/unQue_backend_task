import prisma from "../db/db.config.js";
import { checkTimeOverlap } from "../helper/checkTimeOverlap.js";
import { millisecondsToISOString } from "../helper/timeFormatter.js";
import { USER_ROLE } from "../helper/userRole.js";

export const createAvailability = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;

    const user = req.user;

    if (!user) return res.status(401).json({ message: "User not found" });

    if (user.role !== USER_ROLE.PROFESSOR) {
      return res
        .status(403)
        .json({ message: "Only professors can create availabilities" });
    }

    if (!startTime || !endTime)
      return res
        .status(400)
        .json({ message: "Start time and end time are required" });

    //validation for checking the start time and end time given is a future time
    if (new Date(millisecondsToISOString(Number(startTime))) <= new Date()) {
      return res.status(400).json({
        message: "Invalid time range. Start time must be in the future.",
      });
    }

    // millisecondsToISOString is a helper function to convert milliseconds to ISO string
    if (
      new Date(millisecondsToISOString(Number(startTime))) >=
      new Date(millisecondsToISOString(Number(endTime)))
    ) {
      return res.status(400).json({
        message: "Invalid time range. Start time must be before end time.",
      });
    }

    const hasOverlap = await checkTimeOverlap(
      Number(user.id),
      millisecondsToISOString(Number(startTime)),
      millisecondsToISOString(Number(endTime))
    );

    if (hasOverlap) {
      return res.status(400).json({
        message:
          "The selected time slot overlaps with an existing availability.",
      });
    }

    const availability = await prisma.availability.create({
      data: {
        professorId: Number(user.id),
        startTime: new Date(millisecondsToISOString(Number(startTime))),
        endTime: new Date(millisecondsToISOString(Number(endTime))),
      },
    });

    res.status(201).json({ message: "Availability created successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating availability", error: error.message });
  }
};

export const getAvailability = async (req, res) => {
  const { professorId } = req.params;

  try {
    const availability = await prisma.availability.findMany({
      where: {
        professorId: Number(professorId),
      },
    });
    if (!availability)
      return res.status(404).json({ message: "Availability not found" });

    res.status(200).json({ message: "Availability fetched successfully", availability });

  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting availability", error: error.message });
  }
};
