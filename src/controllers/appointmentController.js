import { checkExistingAppointment } from "../helper/checkExistingAppointment.js";
import prisma from "../db/db.config.js";
import { USER_ROLE } from "../helper/userRole.js";
import { APPOINTMENT_STATUS } from "../helper/appointmentStatus.js";
import { pendingAppointmentCheck } from "../helper/pendingAppointmentCheck.js";

export const createAppointment = async (req, res) => {
  const { professorId, startTime, endTime } = req.body;

  const user = req.user;

  if (!user) return res.status(401).json({ message: "User not found" });

  if (user.role !== USER_ROLE.STUDENT)
    return res
      .status(403)
      .json({ message: "Only students can create appointments" });

  if (!startTime || !endTime)
    return res
      .status(400)
      .json({ message: "Start time and end time are required" });

  if (!/^\d+$/.test(professorId))
    return res.status(400).json({ message: "professorId is required" });

  //validation for checking the start time and end time given is a future time
  if (new Date(startTime) <= new Date())
    return res.status(400).json({
      message: "Invalid time range. Start time must be in the future.",
    });

  if (new Date(startTime) >= new Date(endTime)) {
    return res.status(400).json({
      message: "Invalid time range. Start time must be before end time.",
    });
  }

  const existingAppointment = await checkExistingAppointment(
    Number(professorId),
    Number(user.id),
    new Date(startTime),
    new Date(endTime)
  );

  if (existingAppointment) {
    return res.status(400).json({
      message: "An appointment already exists for the given time range.",
      existingAppointment,
    });
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        studentId: Number(user.id),
        professorId: Number(professorId),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });

    return res.status(201).json({
      message: "Appointment created successfully",
      appointment,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating appointment", error: error.message });
  }
};

export const getAppointments = async (req, res) => {
  const user = req?.user;

  if (!user) return res.status(401).json({ message: "User not found!" });

  if (!user?.role) {
    return res.status(403).json({ message: "User role has not been provided." });
  }

  try {
    const includeClause =
      user?.role === USER_ROLE.STUDENT
        ? {
            appointmentsAsStudent: {
              where: { status: APPOINTMENT_STATUS.PENDING },
            },
          }
        : {
            appointmentsAsProfessor: {
              where: { status: APPOINTMENT_STATUS.PENDING },
            },
          };
    const appointments = await prisma.user.findUnique({
      where: { id: user.id },
      include: includeClause,
    });

    if (!pendingAppointmentCheck(appointments, user.role)) {
      return res.status(404).json({ message: "No appointments found" });
    }

    const { password, email, id, role, ...myAppointments } = appointments;

    
    return res
      .status(200)
      .json({ message: "Appointments fetched successfully", myAppointments });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error getting appointments", error: error.message });
  }
};

export const approveAppointment = async (req, res) => {
  const { id } = req?.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ message: "Appointment Id is missing or invalid" });
  }

  const user = req?.user;

  if (!user) return res.status(401).json({ message: "User not found" });

  if (user?.role !== USER_ROLE.PROFESSOR) {
    return res
      .status(403)
      .json({ message: "Only professors can approve appointments" });
  }
  

  try {
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
    });

    if (!existingAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    if (existingAppointment.status !== APPOINTMENT_STATUS.PENDING) {
      return res
        .status(400)
        .json({ message: "Only pending appointments can be approved" });
    }

    const professorAvailability = await prisma.availability.findMany({
      where: {
        professorId: existingAppointment.professorId,
        OR: [
          {
            startTime: { lte: existingAppointment.startTime },
            endTime: { gte: existingAppointment.startTime },
          },
          {
            startTime: { lte: existingAppointment.endTime },
            endTime: { gte: existingAppointment.endTime },
          },
          {
            startTime: { gte: existingAppointment.startTime },
            endTime: { lte: existingAppointment.endTime },
          },
        ],
        booked: false,
      },
    });

    if (!professorAvailability || professorAvailability.length === 0) {
      return res
        .status(400)
        .json({ message: "No available time slots for the professor" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const approvedAppointment = await tx.appointment.update({
        where: { id: Number(id) },
        data: { status: APPOINTMENT_STATUS.APPROVED },
      });

      const { startTime, endTime } = professorAvailability[0];
      const newAvailabilities = [];

      if (new Date(startTime) < new Date(approvedAppointment.startTime)) {
        newAvailabilities.push({
          professorId: approvedAppointment.professorId,
          startTime,
          endTime: approvedAppointment.startTime,
          booked: false,
        });
      }

      if (new Date(endTime) > new Date(approvedAppointment.endTime)) {
        newAvailabilities.push({
          professorId: approvedAppointment.professorId,
          startTime: approvedAppointment.endTime,
          endTime,
          booked: false,
        });
      }

      await tx.availability.update({
        where: { id: professorAvailability[0].id },
        data: {
          booked: true,
          startTime: approvedAppointment.startTime,
          endTime: approvedAppointment.endTime,
        },
      });

      // Add the new availability blocks, if any
      if (newAvailabilities.length > 0) {
        await tx.availability.createMany({
          data: newAvailabilities,
        });
      }

      return approvedAppointment;
    });

    return res.status(200).json({
      message: "Appointment approved successfully and availability updated",
      approvedAppointment: result,
    });
  } catch (error) {
    console.error("Error approving appointment:", error);
    return res
      .status(500)
      .json({ message: "Error approving appointment", error: error.message });
  }
};

export const deleteAppointment = async (req, res) => {
  const { id } = req?.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ message: "Appointment Id is missing or invalid" });
  }

  const user = req?.user;

  if (!user) return res.status(401).json({ message: "User not found" });

  if (user?.role !== USER_ROLE.STUDENT) {
    return res
      .status(401)
      .json({ message: "Only students can delete their appointments" });
  }

  

  try {
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
    });

    if (!existingAppointment) {
      return res.status(404).json({ message: "No appointment found" });
    }

    if (existingAppointment.studentId !== user.id) {
      return res.status(403).json({
        message: "You do not have permission to delete this appointment",
      });
    }

    if (existingAppointment.status === APPOINTMENT_STATUS.DELETED) {
      return res.status(400).json({ message: "Appointment already deleted" });
    }

    const deletedAppointment = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        status: APPOINTMENT_STATUS.DELETED,
      },
    });
    return res
      .status(200)
      .json({ message: "Appointment deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting appointment", error: error.message });
  }
};

export const cancelAppointment = async (req, res) => {
  const { id } = req?.params;
  const user = req?.user;

  if (!user) return res.status(401).json({ message: "User not found" });

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ message: "Appointment Id is missing or invalid" });
  }

  try {
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
    });
    if (!existingAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (
      existingAppointment.professorId !== user.id &&
      existingAppointment.studentId !== user.id
    ) {
      return res.status(403).json({
        message: "You do not have permission to cancel this appointment",
      });
    }

    if (existingAppointment.status !== APPOINTMENT_STATUS.PENDING) {
      return res
        .status(400)
        .json({ message: "Only pending appointments can be cancelled" });
    }

    const cancelledAppointment = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        status: APPOINTMENT_STATUS.CANCELLED,
      },
    });

    return res.status(200).json({
      message: "Appointment updated successfully",
      cancelledAppointment,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating appointment", error: error.message });
  }
};
