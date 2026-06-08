import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { DemandDetailPage } from "./pages/DemandDetailPage";
import { DemandFormPage } from "./pages/DemandFormPage";
import { DemandsListPage } from "./pages/DemandsListPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/demands" replace />
  },
  {
    path: "/demands",
    element: <DemandsListPage />
  },
  {
    path: "/demands/new",
    element: <DemandFormPage mode="create" />
  },
  {
    path: "/demands/:id",
    element: <DemandDetailPage />
  },
  {
    path: "/demands/:id/edit",
    element: <DemandFormPage mode="edit" />
  }
]);

export function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
