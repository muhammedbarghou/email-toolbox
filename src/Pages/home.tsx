import Navbar from "@/components/Nav"
import { Outlet } from "react-router-dom"
const home = () => {
  return (
    <div>
        <Navbar />
        <div className="px-4 py-6">
          <Outlet />
        </div>
    </div>
  )
}

export default home