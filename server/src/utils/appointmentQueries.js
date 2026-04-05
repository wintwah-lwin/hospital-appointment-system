/** Exclude soft-deleted rows from scheduling and normal UI. */
export const ACTIVE_APPOINTMENT = { isDeleted: { $ne: true } };

export function activeAppointmentWhere(extra = {}) {
  return { ...extra, ...ACTIVE_APPOINTMENT };
}
