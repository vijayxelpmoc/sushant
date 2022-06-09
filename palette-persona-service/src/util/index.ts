const isIsoDate = (dt: string) => {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(dt)) return false;
  const d = new Date(dt);
  return d.toISOString() === dt;
};

export const formatDate = (date: string) => {
  if (isIsoDate(date)) {
    const d = new Date(date);
    let m: string | number = d.getUTCMonth() + 1;
    let dy: string | number = d.getUTCDate();

    m = m < 10 ? `0${m}` : m;
    dy = dy < 10 ? `0${dy}` : dy;
    return `${d.getUTCFullYear()}-${m}-${dy}`;
  }

  return date;
};
