import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Explore from './pages/Explore';
import Booking from './pages/Booking';
import Selection from './pages/Selection';
import Calendar from './pages/Calendar';
import Details from './pages/Details';
import MyBookings from './pages/MyBookings';
import AdminRegister from './pages/AdminRegister';
import BarberDashboard from './pages/BarberDashboard';
import Admin from './pages/Admin';
import BusinessRegister from './pages/BusinessRegister';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/selection" element={<Selection />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/details" element={<Details />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/admin/registro" element={<AdminRegister />} />
        <Route path="/barbero/agenda" element={<BarberDashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/registro-negocio" element={<BusinessRegister />} />
      </Routes>
    </BrowserRouter>
  );
}
