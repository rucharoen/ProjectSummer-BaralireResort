// AuthHeader.jsx
import AuthService from "../auth/auth.service";

const AuthHeader = () => {
  const isUser = AuthService.getCurrentUser();

  if (isUser && isUser.accessToken) {
    // return {
    //   Authorization: `Bearer ${isUser.accessToken}`,
    // };
    return { 'x-access-token': isUser.accessToken };
  } else {
    return {};
  }
};

export default AuthHeader;