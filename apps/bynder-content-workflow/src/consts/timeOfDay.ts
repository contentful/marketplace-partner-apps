export const timeOfDay = () => {
  const hours = new Date().getHours();

  if (hours < 12) return "morning";
  if (hours < 17) return "afternoon";
  return "evening";
};
