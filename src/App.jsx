import { Routes, Route, Navigate } from "react-router-dom";
import './index.css'
import Login from "./pages/Login";
import MaterialRegistration from "./pages/MaterialRegistration";
import CustomerRegister from "./pages/CustomerRegister";
import Layout from "./pages/Layout";
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
          <Route path="materials" element={
              <PrivateRoute>
                <MaterialRegistration />
              </PrivateRoute>
            }
          />
          <Route path="customerRegister"element={
              <PrivateRoute>
                <CustomerRegister />
              </PrivateRoute>
            }
          />
          <Route path="materialRegistration" element={
              <PrivateRoute>
                <MaterialRegistration />
              </PrivateRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

