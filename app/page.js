import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to CryptoPay</h1>
      <p className="text-lg mb-8">Accept payments in multiple cryptocurrencies with ease.</p>
      <Link href="/auth/signin">
        <Button>Sign In</Button>
      </Link>
    </div>
  );
}