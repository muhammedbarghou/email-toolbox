export default function Logo() {
  return (
    <div className="flex items-center space-x-2">
      <img
        src="/Logo.svg"
        alt="Logo"
        className="h-8 w-8 rounded-sm"
      />
      <span className="font-bold text-lg">MailerTools</span>
    </div>
  )
}
