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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { prisma } from "@/lib/prisma";
import { toast } from "@/components/ui/use-toast";
import { Users, Trash2 } from "lucide-react";

export default function Team() {
  const [session, setSession] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newMember, setNewMember] = useState({ email: "", role: "viewer" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      const sess = await auth();
      if (!sess || sess.user.role !== "merchant") {
        redirect("/auth/signin");
      }
      setSession(sess);
      const members = await prisma.teamMember.findMany({
        where: { merchantId: sess.user.id },
      });
      setTeamMembers(members);
    }
    fetchSession();
  }, []);

  useEffect(() => {
    if (!session) return;
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "teamMember" && data.userId === session.user.id) {
        setTeamMembers((prev) => [...prev, data.teamMember]);
      }
    };
    return () => ws.close();
  }, [session]);

  const handleInviteMember = async () => {
    if (!newMember.email) {
      toast({
        title: "Error",
        description: "Email is required.",
        variant: "destructive",
      });
      return;
    }
    const teamMember = await prisma.teamMember.create({
      data: {
        merchantId: session.user.id,
        userId: session.user.id, // Placeholder; update with actual user ID if exists
        email: newMember.email,
        role: newMember.role,
      },
    });
    setTeamMembers([...teamMembers, teamMember]);
    setIsDialogOpen(false);
    setNewMember({ email: "", role: "viewer" });
    toast({
      title: "Invitation Sent",
      description: `Invitation sent to ${newMember.email}.`,
    });

    const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL);
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "teamMember",
          userId: session.user.id,
          teamMember,
        })
      );
      ws.close();
    };
  };

  const handleRemoveMember = async (id) => {
    await prisma.teamMember.delete({ where: { id } });
    setTeamMembers(teamMembers.filter((member) => member.id !== id));
    toast({
      title: "Member Removed",
      description: "The team member has been removed.",
    });
  };

  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Team</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary-merchant hover:bg-emerald-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white rounded-lg">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="border-gray-300 focus:ring-primary-merchant"
                />
                <Select
                  value={newMember.role}
                  onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                >
                  <SelectTrigger className="border-gray-300 focus:ring-primary-merchant">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInviteMember} className="bg-primary-merchant hover:bg-emerald-600">
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Your Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm text-gray-700">Email</TableHead>
                    <TableHead className="text-sm text-gray-700">Role</TableHead>
                    <TableHead className="text-sm text-gray-700">Invited</TableHead>
                    <TableHead className="text-sm text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-gray-500 py-6">
                        No team members found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    teamMembers.map((member) => (
                      <TableRow key={member.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm text-gray-900">{member.email}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            className="flex items-center gap-1 border-gray-300 hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}