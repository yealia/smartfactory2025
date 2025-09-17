import { Routes, Route, Navigate } from "react-router-dom";
import './index.css'
import Login from "./pages/Login";
import MaterialRegistration from "./pages/MaterialRegistration";
import CustomerRegister from "./pages/CustomerRegister";
import SuppliersRegister from "./pages/SuppliersRegister";
import Layout from "./layouts/Layout";
import MainPage from "./pages/MainPage";
import ProjectRegister from "./pages/ProjectRegister";
import Bom from "./pages/Bom";
import Vessels from "./pages/vessel";
import { AuthProvider } from "./auth/AuthContext";
import { useAuth } from "./auth/AuthContext";
import PurchaseOrder from "./pages/PurchaseOrder";
import InventoryMovement from "./pages/InventoryMovement";
import Inventory from "./pages/Inventory";
import ProjectPlan from "./pages/ProjectPlan";
import SalesOrder from "./pages/SalesOrder";

// ✅ [추가] 새로 만들 페이지 컴포넌트 import
import Department from "./pages/Department";
import Employee from "./pages/Employee";

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
          <Route path="projectRegister" element={<PrivateRoute><ProjectRegister /></PrivateRoute>} />
          <Route path="projectPlan" element={<PrivateRoute><ProjectPlan /></PrivateRoute>} />
          <Route path="customerRegister" element={<PrivateRoute><CustomerRegister /></PrivateRoute>} />
          <Route path="suppliersRegister" element={<PrivateRoute><SuppliersRegister /></PrivateRoute>} />
          <Route path="materialRegistration" element={<PrivateRoute><MaterialRegistration /></PrivateRoute>} />
          <Route path="boms" element={<PrivateRoute><Bom /></PrivateRoute>} />
          <Route path="boms/:vesselId" element={<PrivateRoute><Bom /></PrivateRoute>} />
          <Route path="vessel" element={<PrivateRoute><Vessels /></PrivateRoute>} />
          <Route path="purchaseOrder" element={<PrivateRoute><PurchaseOrder /></PrivateRoute>} />
          <Route path="inventoryMovement" element={<PrivateRoute><InventoryMovement /></PrivateRoute>} />
          <Route path="inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
          <Route path="salesOrder" element={<PrivateRoute><SalesOrder /></PrivateRoute>} />



          {/* ✅ [추가] 부서 및 사원 관리 라우트 연결 */}
          <Route path="department" element={<PrivateRoute><Department /></PrivateRoute>} />
          <Route path="employee" element={<PrivateRoute><Employee /></PrivateRoute>} />
          
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}