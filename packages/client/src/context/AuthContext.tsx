import { useApolloClient, useQuery } from "@apollo/client";
import { createContext, ReactNode, useContext, useState } from "react";
import { ME_QUERY } from "../graphql/queries";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContext {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContext>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const client = useApolloClient();

  const { loading } = useQuery(ME_QUERY, {
    skip: !token,
    onCompleted: (data) => {
      if (data?.me) {
        setUser(data.me);
      }
    },
  });

  const login = (token: string, user: User) => {
    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    client.resetStore();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { AuthProvider };
