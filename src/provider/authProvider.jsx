import axios from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "../../config/firebase"; // Make sure this path is correct
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [token, setToken_] = useState(null);
  const [loading, setLoading] = useState(true);

  const setToken = (newToken) => {
    setToken_(newToken);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        setToken_(idToken);
        axios.defaults.headers.common["Authorization"] = "Bearer " + idToken;
        localStorage.setItem("token", idToken);
      } else {
        setToken_(null);
        delete axios.defaults.headers.common["Authorization"];
        localStorage.removeItem("token");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const contextValue = useMemo(
    () => ({
      token,
      setToken,
    }),
    [token]
  );

  if (loading) return null; // or a spinner

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
