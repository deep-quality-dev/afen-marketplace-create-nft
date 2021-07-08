import { AxiosError } from "axios";
import React, { useState, useEffect } from "react";
import useNotifier from "../../hooks/useNotifier";
import { User } from "../../types/User";
import { MessageProps } from "../Message/Message";
import { login, logout, register } from "./apis/auth";
import useUser from "../../hooks/useUser";

export interface LoginInput extends Pick<User, "email" | "password"> {}

export interface IAuthContext {
  isAuthenticated: boolean;
  loginDialog: boolean;
  registerDialog: boolean;
  message: MessageProps | null;
  setIsAuthenticated: (value?: boolean) => void;
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
  setIsAuthenticated: undefined,
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

  const { data: notification } = useNotifier();
  const { user, setUser, disconnectWallet } = useUser();

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
        setIsAuthenticated,
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
