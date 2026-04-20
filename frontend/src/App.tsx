import { BrowserRouter, Route, Routes } from "react-router-dom"
import { GraveyardPage } from "./pages/GraveyardPage"
import { HomePage } from "./pages/HomePage"
import { SettingsPage } from "./pages/SettingsPage"
import { TokenPage } from "./pages/TokenPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/graveyard" element={<GraveyardPage />} />
        <Route path="/token/:address" element={<TokenPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
