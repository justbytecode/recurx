import './globals.css';
import { Inter } from 'next/font/google';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Payment Platform',
  description: 'Decentralized payment platform for users and merchants',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}