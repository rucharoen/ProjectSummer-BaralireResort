// utils/searchNav.js
import dayjs from "dayjs";

export const cleanParams = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  );

export const buildSearchQuery = ({
  destination,
  checkIn,
  checkOut,
  rooms,
  adults,
  children,
  guests,
}) => {
  const params = {
    destination: destination || "",
    checkIn: checkIn ? dayjs(checkIn).format("YYYY-MM-DD") : undefined,
    checkOut: checkOut ? dayjs(checkOut).format("YYYY-MM-DD") : undefined,
    rooms,
    adults,
    children,
    guests,
  };
  return new URLSearchParams(cleanParams(params)).toString();
};

export const goToSearchResults = (navigate, payload) => {
  navigate(`/search-results?${buildSearchQuery(payload)}`);
};
