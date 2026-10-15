import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

// Fontes embutidas no próprio HTML (funciona sem internet). Só a do visual escolhido entra no arquivo.
if (import.meta.env.VITE_VISUAL === "forum") import("./fontes-forum")
else import("./fontes-tremor")

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
