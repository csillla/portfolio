import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Project from "./pages/Project";
import NavBar from "./components/NavBar";
import PreNav from "./components/PreNav";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <PreNav />
      <NavBar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/work/:projectId" element={<Project />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
