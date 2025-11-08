import Navbar from "./Navbar";
import ProtectedRoute from "../../middleware/ProtectedRoute";
import { UseAuth } from "../../hooks/UseAuth";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
    const { isUser, logOut } = UseAuth();

    return (
        <ProtectedRoute roles={["ROLE_ADMIN", "ROLE_MODERATOR"]}>
            <Navbar isUser={isUser} logOut={logOut} />
            <Outlet />
        </ProtectedRoute>
    )
}
export default AdminLayout