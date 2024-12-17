import { APPOINTMENT_STATUS } from "./appointmentStatus.js";
import { USER_ROLE } from "./userRole.js";

export const pendingAppointmentCheck = (appointments,role) => {

    if (role === USER_ROLE.STUDENT) {
        return appointments.appointmentsAsStudent.some((appointment) => appointment.status === APPOINTMENT_STATUS.PENDING);
    } else if (role === USER_ROLE.PROFESSOR) {
        return appointments.appointmentsAsProfessor.some((appointment) => appointment.status === APPOINTMENT_STATUS.PENDING);
    }
}