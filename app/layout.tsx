import './globals.css';
export const metadata = {
  title: 'IT Study Hub | منصة تقنية المعلومات الذكية',
  description: 'منصة جامعية تفاعلية تتطور تلقائياً مع كل محاضرة',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="bg-slate-950 text-white antialiased">{children}</body>
    </html>
  );
}
