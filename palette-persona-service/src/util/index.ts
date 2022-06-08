const isIsoDate = (dt: string) => {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(dt)) return false;
  const d = new Date(dt);
  return d.toISOString() === dt;
};

export const formatDate = (date: string) => {
  if (isIsoDate(date)) {
    const d = new Date(date);
    return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
  }

  return date;
};
