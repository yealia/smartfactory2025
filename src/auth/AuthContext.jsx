// src/auth/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // 로그인된 사용자 정보 저장
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("저장된 user 파싱 오류:", e);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async ({ email, password }) => {
    try {
      const res = await fetch("http://localhost:8081/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),

      });
      if (!res.ok) throw new Error("서버 오류");

      const data = await res.json(); // { success, email, token }
      console.log("서버응답", data);

      console.log(data);
      //fla902@naver.com

      if (data.success) {
        const loggedInUser = { email: data.email };
        console.log("로그인 성공 user:", loggedInUser);
        setUser(loggedInUser); // 여기만 호출
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        localStorage.setItem("token", data.token);
        console.log("AuthContext 저장 token:", data.token);
        return { success: true, user: loggedInUser };
      }
      return { success: false };
    } catch (err) {
      console.error("로그인 오류:", err);
      return { success: false };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
