// Utility function to calculate delivery dates
export const getDeliveryDates = () => {
  const today = new Date();
  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Add 1 business day for start date
  let startDate = new Date(today);
  let daysAdded = 0;
  let businessDaysAdded = 0;

  while (businessDaysAdded < 1) {
    daysAdded++;
    startDate = new Date(today.getTime() + daysAdded * 24 * 60 * 60 * 1000);
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
      businessDaysAdded++;
    }
  }

  // Add 3 business days for end date
  let endDate = new Date(today);
  daysAdded = 0;
  businessDaysAdded = 0;

  while (businessDaysAdded < 3) {
    daysAdded++;
    endDate = new Date(today.getTime() + daysAdded * 24 * 60 * 60 * 1000);
    const dayOfWeek = endDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDaysAdded++;
    }
  }

  return {
    startDay: daysOfWeek[startDate.getDay()],
    endDay: daysOfWeek[endDate.getDay()]
  };
};
