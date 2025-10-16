import { BrowserRouter, Routes, Route } from 'react-router-dom'
import EmailHeaderProcessor from './Pages/EmailTool'
import EmlToTxtConverter from './Pages/EmlToTxtConverter'
import IPComparator from './Pages/IPComparator'
import Navbar from './components/Nav'
import { Toaster } from 'sonner'
import { ThemeProvider } from "@/components/theme-provider"


function App() {

  return (
    <div className="min-h-screen ">
      <ThemeProvider>
      <Navbar />
      <BrowserRouter>
        <Routes>
          <Route path="/email-header-processor" element={<EmailHeaderProcessor />} />
          <Route path="/eml-to-txt-converter" element={<EmlToTxtConverter />} />
          <Route path="/ip-comparator" element={<IPComparator />} />
        </Routes>
      </BrowserRouter>
    <Toaster />
    </ThemeProvider>
    </div>

  )
}

export default App
