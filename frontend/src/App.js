import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "./components/Layout";
import { LogEntryProvider } from "./components/LogEntryProvider";
import Dashboard from "./pages/Dashboard";
import Systemer from "./pages/Systemer";
import SystemDetalje from "./pages/SystemDetalje";
import Opgaver from "./pages/Opgaver";
import Kontakter from "./pages/Kontakter";
import Organisationer from "./pages/Organisationer";
import Logbog from "./pages/Logbog";
import Indstillinger from "./pages/Indstillinger";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <LogEntryProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/systemer" element={<Systemer />} />
            <Route path="/systemer/:id" element={<SystemDetalje />} />
            <Route path="/opgaver" element={<Opgaver />} />
            <Route path="/kontakter" element={<Kontakter />} />
            <Route path="/organisationer" element={<Organisationer />} />
            <Route path="/logbog" element={<Logbog />} />
            <Route path="/indstillinger" element={<Indstillinger />} />
          </Route>
        </Routes>
      </LogEntryProvider>
    </BrowserRouter>
  );
}
