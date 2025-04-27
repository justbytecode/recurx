'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast'; // Updated import
import { FileText, Upload } from 'lucide-react';

export default function KYB() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [kybStatus, setKybStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDocument, setNewDocument] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'merchant') {
      router.push('/auth/signin');
    } else {
      fetchKYBStatus();
    }
  }, [session, status, router]);

  const fetchKYBStatus = async () => {
    try {
      const response = await fetch('/api/merchant/kyb', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch KYB status');
      }
      const data = await response.json();
      setKybStatus(data.status);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching KYB status:', error);
      toast.error('Failed to load KYB status.', {
        style: {
          borderRadius: '8px',
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
        },
      });
    }
  };

  const handleUploadDocument = async () => {
    if (!newDocument) {
      toast.error('Please select a document to upload.', {
        style: {
          borderRadius: '8px',
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
        },
      });
      return;
    }
    try {
      const formData = new FormData();
      formData.append('document', newDocument);
      const response = await fetch('/api/merchant/kyb', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to upload document');
      }
      const data = await response.json();
      setDocuments([...documents, data.document]);
      setNewDocument(null);
      toast.success('Your document has been uploaded successfully.', {
        style: {
          borderRadius: '8px',
          background: '#10B981',
          color: '#fff',
          padding: '16px',
        },
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document.', {
        style: {
          borderRadius: '8px',
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
        },
      });
    }
  };

  if (status === 'loading' || !session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Know Your Business (KYB)</h1>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">KYB Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-merchant" />
              <p className="text-sm font-medium text-gray-900">
                Status:{' '}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    kybStatus === 'verified'
                      ? 'bg-green-100 text-primary-merchant'
                      : kybStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {kybStatus || 'Not Submitted'}
                </span>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Uploaded Documents</h3>
              {documents.length === 0 ? (
                <p className="text-sm text-gray-500">No documents uploaded.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {documents.map((doc, index) => (
                    <li key={index} className="text-sm text-gray-600">{doc}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-y-2">
              <Input
                type="file"
                onChange={(e) => setNewDocument(e.target.files[0])}
                className="border-gray-300 focus:ring-primary-merchant"
              />
              <Button
                onClick={handleUploadDocument}
                className="bg-primary-merchant hover:bg-emerald-600 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}