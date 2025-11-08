import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/auth/auth.service";

export const UseAuth = () => {
    // ตรวจสอบข้อมูลผู้ใช้
    const currentUser = AuthService.getCurrentUser();
    
    // เซ็ตค่าเริ่มต้นตามข้อมูลที่มีอยู่ ไม่ใช่ null
    const [isUser, setIsUser] = useState(currentUser || null);
    const [isMember, setIsMember] = useState(currentUser ? currentUser.roles.includes("ROLE_MEMBER") : false);
    const [isAdmin, setIsAdmin] = useState(currentUser ? currentUser.roles.includes("ROLE_ADMIN") : false);
    const [isModerator, setIsModerator] = useState(currentUser ? currentUser.roles.includes("ROLE_MODERATOR") : false);
    
    const navigate = useNavigate();

    const logOut = () => {
        AuthService.logout();
        setIsUser(null);
        setIsMember(false);
        setIsAdmin(false);
        setIsModerator(false);

        navigate("/");
    };

    return { isUser, isMember, isAdmin, isModerator, logOut };
}