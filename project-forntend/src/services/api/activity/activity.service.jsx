import axios from "axios";
import AuthHeader from "../../common/AuthHeader";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const getAll = () => {
    return axios.get(`${BASE_URL}/api/activity`, { headers: AuthHeader() });
};

const ActivityService = {
    getAll
}

export default ActivityService;