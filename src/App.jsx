import { Routes, Route, Navigate } from "react-router-dom";
import './index.css'
import Login from "./pages/Login";
import MaterialRegistration from "./pages/MaterialRegistration";
import Layout from "./layouts/Layout";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<Layout />}>
        <Route path="materials/register" element={<MaterialRegistration />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

