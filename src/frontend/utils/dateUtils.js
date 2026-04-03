/**
 * Safe date conversion and formatting utility for KrishiSaathi
 * Resolves: "date.getDate is not a function"
 */

export const safeDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export const formatDate = (value) => {
  const d = safeDate(value);
  if (!d) return "N/A";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const getDay = (value) => {
  const d = safeDate(value);
  return d ? d.getDate() : "";
};

export const getMonth = (value) => {
  const d = safeDate(value);
  // Returns 1-12
  return d ? d.getMonth() + 1 : "";
};

export const getYear = (value) => {
  const d = safeDate(value);
  return d ? d.getFullYear() : "";
};
