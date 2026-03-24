import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { LoginPromptProvider } from "./contexts/LoginPromptContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import HomePage from "./pages/Home";
import Works from "./pages/Works";
import WorkForm from "./pages/WorkForm";
import WorkDetail from "./pages/WorkDetail";
import Artist from "./pages/Artist";
import ArtistWorksRedirect from "./components/ArtistWorksRedirect";
import Orders from "./pages/Orders";
import OrderForm from "./pages/OrderForm";
import OrderDetail from "./pages/OrderDetail";
import PaymentReturn from "./pages/PaymentReturn";
import AdminDashboard from "./pages/AdminDashboard";
import Commissions from "./pages/Commissions";
import Account from "./pages/Account";
import MainLayout from "./layouts/MainLayout";
import ProtectedArtistRoute from "./components/ProtectedArtistRoute";
import TagDetail from "./pages/TagDetail";

function App() {
  return (
    <BrowserRouter>
      <LoginPromptProvider>
      <ToastContainer position = "top-right" autoClose = {4000} theme = "light" />
      <Routes>
        <Route path = "/login" element = {<Login />} />
        <Route path = "/register" element = {<Register />} />
        <Route element = {<MainLayout />}>
          <Route path = "/" element = {<Navigate to = "/home" replace />} />
          <Route path = "/home" element = {<HomePage />} />
          <Route path = "/me" element = {<Artist />} />
          <Route path = "/profiles/:username" element = {<Profile />} />
          <Route path = "/account" element = {<Account />} />
          <Route path = "/orders" element = {<Orders />} />
          <Route path = "/orders/new" element = {<OrderForm />} />
          <Route path = "/orders/:orderId/edit" element = {<OrderForm />} />
          <Route path = "/orders/:id" element = {<OrderDetail />} />
          <Route path = "/payment/vnpay/return" element = {<PaymentReturn />} />
          <Route path = "/admin/dashboard" element = {<AdminDashboard />} />
          <Route path = "/commissions" element = {<Commissions />} />
          <Route path = "/artist/:username" element = {<Artist />} />
          <Route path = "/tags/:tagName" element = {<TagDetail />} />
          <Route path = "/works/:genre" element = {<Works />} />
          <Route path = "/artist/:username/works/:genre" element = {<ArtistWorksRedirect />} />
          <Route path = "/work/:id" element = {<WorkDetail />} />
          <Route path = "/works/add" element = {<ProtectedArtistRoute><WorkForm /></ProtectedArtistRoute>} />
          <Route path = "/works/update/:id" element = {<ProtectedArtistRoute><WorkForm /></ProtectedArtistRoute>} />
        </Route>
      </Routes>
      </LoginPromptProvider>
    </BrowserRouter>
  );
}

export default App;
