import { Routes, Route, Navigate } from "react-router-dom";
import './index.css'
import Login from "./pages/Login";
import MaterialRegistration from "./pages/MaterialRegistration";
import CustomerRegister from "./pages/CustomerRegister";
import SuppliersRegister from "./pages/SuppliersRegister";
import Layout from "./layouts/Layout";
import MainPage from "./pages/MainPage";
import ProjectRegister from "./pages/ProjectRegister";
import { AuthProvider } from "./auth/AuthContext";
import { useAuth } from "./auth/AuthContext";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>로딩중...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/*기본경로 로그인*/}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/*로그인*/}
        <Route path="/login" element={<Login />} />

        {/* Layout 아래에 들어가는 보호된 메뉴들 */}
        <Route path="/" element={<Layout />}>
          <Route path="mainPage" element={<PrivateRoute><MainPage /></PrivateRoute>} />
          <Route path="materials" element={<PrivateRoute><MaterialRegistration /></PrivateRoute>} />
          <Route path="projectRegisters" element={<PrivateRoute><ProjectRegister /></PrivateRoute>} />
          <Route path="customerRegister" element={<PrivateRoute><CustomerRegister /></PrivateRoute>} />
          <Route path="suppliersRegister" element={<PrivateRoute><SuppliersRegister /></PrivateRoute>} />
          <Route path="materialRegistration" element={<PrivateRoute><MaterialRegistration /></PrivateRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

