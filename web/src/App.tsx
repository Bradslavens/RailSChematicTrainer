import { Routes, Route, Navigate } from "react-router-dom";
import { TopBar } from "./components/TopBar.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { HomePage } from "./pages/HomePage.js";
import { SchematicsListPage } from "./pages/SchematicsListPage.js";
import { SchematicViewerPage } from "./pages/SchematicViewerPage.js";
import { PinDropPage } from "./pages/PinDropPage.js";
import { AdminSchematicsPage } from "./pages/admin/AdminSchematicsPage.js";
import { AdminSchematicDetailPage } from "./pages/admin/AdminSchematicDetailPage.js";

export default function App() {
  return (
    <div className="app-shell">
      <TopBar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/play/pin-drop"
          element={
            <ProtectedRoute>
              <PinDropPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schematics"
          element={
            <ProtectedRoute>
              <SchematicsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schematics/:id"
          element={
            <ProtectedRoute>
              <SchematicViewerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminSchematicsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/schematics/:id"
          element={
            <ProtectedRoute requireAdmin>
              <AdminSchematicDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
