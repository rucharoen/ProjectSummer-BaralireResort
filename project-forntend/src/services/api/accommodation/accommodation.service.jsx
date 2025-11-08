import axios from "axios";
import AuthHeader from "../../common/AuthHeader";
const BASE_URL = import.meta.env.VITE_BASE_URL;


const getPopularAccommodation = () => {
    return axios.get(`${BASE_URL}/api/accommodation/popular`);
};

const getPromotion = () => {
    return axios.get(`${BASE_URL}/api/accommodation/promotion`);
};

const getAll = async () => {
    return await axios.get(`${BASE_URL}/api/accommodation`, { headers: AuthHeader() });
};

const getSearch = async (destination, checkIn, checkOut, guests) => {
    console.log("getSearch", destination, checkIn, checkOut, guests);
    return await axios.get(`${BASE_URL}/api/accommodation/search`, {
        params: {
            destination,
            checkIn,
            checkOut,
            guests
        }
        
    });
    
}

const getAvailability = (checkInDate, checkOutDate) => {
  console.log("📅 Sending check-in/out:", checkInDate, checkOutDate);

  return axios.get(`${BASE_URL}/api/accommodation/availableroom`, {
    params: {
  checkIn: checkInDate,
  checkOut: checkOutDate
}
  });
};

  
const createBooking = (checkInDate, checkOutDate) => {
  return axios.post(`${BASE_URL}/api/booking`, {
    checkInDate,
    checkOutDate
  });
};


const getWithRates = async () => {
  return await axios.get(`${BASE_URL}/api/accommodation/with-rates`, {
    headers: AuthHeader(),
  });
};

const AccommodationService = {
    getPopularAccommodation,
    getPromotion,
    getAll,
    getSearch,
    getAvailability,
    getWithRates,
}

export default AccommodationService;