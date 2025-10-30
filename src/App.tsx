import {  Routes, Route } from 'react-router-dom'
import EmailHeaderProcessor from './Pages/EmailTool'
import EmlToTxtConverter from './Pages/EmlToTxtConverter'
import IPComparator from './Pages/IPComparator'
import Navbar from './components/Nav'
import { Toaster } from 'sonner'
import { Suspense } from 'react'
import { Home } from './Pages/home'
import PhotoEditor from './Pages/PhotoEditor'
import { Contact } from './Pages/contact-us'

function App() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <section className="flex-grow px-4 md:px-6 py-4">
        <Suspense fallback={<div className="p-4">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/header-processor" element={<EmailHeaderProcessor />} />
            <Route path="/eml-to-txt-converter" element={<EmlToTxtConverter />} />
            <Route path="/ip-comparator" element={<IPComparator />} />
            <Route path="/photo-editor" element={<PhotoEditor />} />
            <Route path="/contact-us" element={<Contact />} />
          </Routes>
        </Suspense>
      </section>
      <footer className="mt-20 w-full border-t p-6 text-center text-sm ">
        &copy; {new Date().getFullYear()} MailerTools. All rights reserved.
      </footer>
      <Toaster />
    </main>
  )
}

export default App