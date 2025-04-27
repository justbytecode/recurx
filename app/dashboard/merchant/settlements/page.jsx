"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { prisma } from "@/lib/prisma";
import { toast } from "@/components/ui/use-toast";
import { DollarSign } from "lucide-react";

export default function Settlements() {
  const [session, setSession] = useState(null);
  const [kybStatus, setKybStatus] = useState(null);
  const [settlementConfig, setSettlementConfig] = useState({
    method: "crypto",
    bankAccount: "",
    cryptoWallet: "",
    currency: "USDT",
  });

  useEffect(() => {
    async function fetchSession() {
      const sess = await auth();
      if (!sess || sess.user.role !== "merchant") {
        redirect("/auth/signin");
      }
      setSession(sess);
      const kyb = await prisma.kyb.findUnique({
        where: { merchantId: sess.user.id },
      });
      setKybStatus(kyb);
      const wallet = await prisma.wallet.findUnique({
        where: { userId: sess.user.id },
      });
      if (wallet) {
        setSettlementConfig((prev) => ({ ...prev, cryptoWallet: wallet.address }));
      }
    }
    fetchSession();
  }, []);

  const handleSaveSettlement = async () => {
    if (settlementConfig.method === "fiat" && (!kybStatus || kybStatus.status !== "approved")) {
      toast({
        title: "Error",
        description: "Fiat settlements require approved KYB verification.",
        variant: "destructive",
      });
      return;
    }
    if (!settlementConfig.cryptoWallet && settlementConfig.method === "crypto") {
      toast({
        title: "Error",
        description: "Please connect a wallet for crypto settlements.",
        variant: "destructive",
      });
      return;
    }
    if (!settlementConfig.bankAccount && settlementConfig.method === "fiat") {
      toast({
        title: "Error",
        description: "Please provide a bank account for fiat settlements.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Settlement Config Saved",
      description: `Settlements will be processed via ${settlementConfig.method}.`,
    });
  };

  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settlements</h1>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Settlement Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Settlement Method</label>
                <Select
                  value={settlementConfig.method}
                  onValueChange={(value) => setSettlementConfig({ ...settlementConfig, method: value })}
                >
                  <SelectTrigger className="mt-1 border-gray-300 focus:ring-primary-merchant">
                    <SelectValue placeholder="Select Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="fiat" disabled={!kybStatus || kybStatus.status !== "approved"}>
                      Fiat (Requires KYB)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {settlementConfig.method === "crypto" && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Crypto Wallet Address</label>
                  <Input
                    value={settlementConfig.cryptoWallet}
                    disabled
                    className="mt-1 border-gray-300 bg-gray-100"
                    placeholder="Connected wallet address"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Settlements will be sent to your connected wallet.
                  </p>
                </div>
              )}
              {settlementConfig.method === "fiat" && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Bank Account Details</label>
                  <Input
                    value={settlementConfig.bankAccount}
                    onChange={(e) => setSettlementConfig({ ...settlementConfig, bankAccount: e.target.value })}
                    className="mt-1 border-gray-300 focus:ring-primary-merchant"
                    placeholder="Enter bank account details"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Settlement Currency</label>
                <Select
                  value={settlementConfig.currency}
                  onValueChange={(value) => setSettlementConfig({ ...settlementConfig, currency: value })}
                >
                  <SelectTrigger className="mt-1 border-gray-300 focus:ring-primary-merchant">
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="BNB">BNB</SelectItem>
                    <SelectItem value="MATIC">MATIC</SelectItem>
                    <SelectItem value="TRX">TRX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSaveSettlement}
                className="bg-primary-merchant hover:bg-emerald-600"
              >
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}