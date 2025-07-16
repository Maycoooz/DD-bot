import { Routes, Route } from "react-router-dom"
import HomePage from "./HomePage"
import LoginPage from "./Login"
import ChatbotPage from "./ChatbotPage"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/chat" element={<ChatbotPage />} />
    </Routes>
  )
}
