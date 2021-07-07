import { AxiosError } from "axios";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import useNotifier from "../../hooks/useNotifier";
// import useUser from "../../hooks/useUser";
import { User } from "../../types/User";
import { MessageProps } from "../Message/Message";
import { authCookieName, login, logout, register } from "./apis/auth";
import cookieCutter from "cookie-cutter";
import useUser from "../../hooks/useUser";
import { getUser } from "../User/api";

const protectedRoutes = ["/create", "/user"];

export interface LoginInput extends Pick<User, "email" | "password"> {}

export interface IAuthContext {
  isAuthenticated: boolean;
  loginDialog: boolean;
  registerDialog: boolean;
  message: MessageProps | null;
  toggleLoginDialog: (value?: boolean) => void;
  toggleRegisterDialog: (value?: boolean) => void;
  login: (data: LoginInput) => Promise<void>;
  register: (data: User) => Promise<void>;
  logout: () => void;
}

export const AuthContext = React.createContext<IAuthContext>({
  isAuthenticated: false,
  loginDialog: false,
  registerDialog: false,
  message: null,
  toggleLoginDialog: undefined,
  toggleRegisterDialog: undefined,
  login: undefined,
  register: undefined,
  logout: undefined,
});

export const AuthProvider: React.FC = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginDialog, setLoginDialog] = useState<boolean>(false);
  const [registerDialog, setRegisterDialog] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageProps>(null);

  const { route, push: routeTo } = useRouter();
  const { data: notification } = useNotifier();
  const { user, setUser, disconnectWallet } = useUser();

  useEffect(() => {
    const token = cookieCutter.get(authCookieName);
    if (token) {
      if (user?.address) {
        getUser(user?.address).then((response) => {
          // setIsAuthenticated(true);
          setUser(response);
        });
      }
      // setIsAuthenticated(true);
    }
  });

  // useEffect(() => {
  //   // handling protected routes
  //   if (protectedRoutes.includes(route)) {
  //     if (!isAuthenticated) {
  //       // display login dialog
  //       // TODO: improve by preventing next route rather than routing to home
  //       routeTo("/");
  //       setLoginDialog(true);
  //     }
  //   }
  // }, [route]);

  useEffect(() => {
    if (notification) {
      setLoginDialog(false);
      setRegisterDialog(false);
    }
  }, [notification]);

  useEffect(() => {
    // reset messages
    setMessage(null);
  }, [loginDialog, registerDialog]);

  const dismissMessage = () => {
    setMessage(null);
  };

  const loginUser = async (data: LoginInput): Promise<void> => {
    setMessage(null);
    await login(data)
      .then((responseData) => {
        setIsAuthenticated(true);
        setUser(responseData.data.user);
        return setLoginDialog(false);
      })
      .catch((error: AxiosError) => {
        return setMessage({
          data: {
            text: error.response.data.message || "An error occured",
            status: "error",
          },
          onDismiss: dismissMessage,
        });
      });
  };

  const registerUser = async (data: User): Promise<void> => {
    setMessage(null);
    await register(data)
      .then((responseData) => {
        return responseData;
      })
      .catch((error: AxiosError) => {
        return setMessage({
          data: {
            text: error.response.data.message || "An error occured",
            status: "error",
          },
          onDismiss: dismissMessage,
        });
      });
  };

  const logoutUser = () => {
    logout();
    setUser(null);
    disconnectWallet();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loginDialog,
        registerDialog,
        message,
        toggleLoginDialog: (value) => setLoginDialog(value || !loginDialog),
        toggleRegisterDialog: (value) =>
          setRegisterDialog(value || !registerDialog),
        login: loginUser,
        register: registerUser,
        logout: logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthContext.displayName = "AuthContext";
export const Auth = AuthContext.Consumer;
export default Auth;
