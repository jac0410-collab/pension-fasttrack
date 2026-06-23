'use client'
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit2, UserMinus } from 'lucide-react';
import type { Lawyer } from '@/types';

export default function AdminDutyPage() {
  const supabase = createClient();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Lawyer | null>(null);
  const [form, setForm] = useState({ name: '', reg_no: '', region: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const fetchLawyers = useCallback(async () => {
    const { data } = await supabase.from('lawyers').select('*').order('name');
    setLawyers((data as Lawyer[]) ?? []);
  }, [supabase]);

  useEffect(() => { fetchLawyers(); }, [fetchLawyers]);

  function openAdd() {
    setEditing(null);
    setForm({ name: '', reg_no: '', region: '', phone: '' });
    setShowDialog(true);
  }

  function openEdit(l: Lawyer) {
    setEditing(l);
    setForm({ name: l.name, reg_no: l.reg_no, region: l.region, phone: l.phone });
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.name || !form.reg_no || !form.region || !form.phone) {
      toast.warning('모든 항목을 입력해주세요.'); return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from('lawyers').update(form).eq('id', editing.id);
        if (error) throw error;
        toast.success('수정 완료');
      } else {
        const { error } = await supabase.from('lawyers').insert({ ...form, is_active: true, monthly_count: 0 });
        if (error) throw error;
        toast.success('노무사 추가 완료');
      }
      setShowDialog(false);
      fetchLawyers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string, active: boolean) {
    const { error } = await supabase.from('lawyers').update({ is_active: !active }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(active ? '비활성화 완료' : '활성화 완료');
    fetchLawyers();
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0D2433]">당직 노무사 관리</h1>
            <p className="text-sm text-gray-500 mt-1">노무사 Pool 전체 관리</p>
          </div>
          <Button onClick={openAdd} className="bg-[#0D2433] hover:bg-[#00A693]">
            <Plus className="w-4 h-4 mr-1" /> 노무사 추가
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#0D2433] hover:bg-[#0D2433]">
                  <TableHead className="text-white">이름</TableHead>
                  <TableHead className="text-white">등록번호</TableHead>
                  <TableHead className="text-white">지역</TableHead>
                  <TableHead className="text-white">연락처</TableHead>
                  <TableHead className="text-white">이번달 처리건</TableHead>
                  <TableHead className="text-white">상태</TableHead>
                  <TableHead className="text-white">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lawyers.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell className="text-sm text-gray-500">{l.reg_no}</TableCell>
                    <TableCell className="text-sm">{l.region}</TableCell>
                    <TableCell className="text-sm">{l.phone}</TableCell>
                    <TableCell className="text-sm">{l.monthly_count}건</TableCell>
                    <TableCell>
                      <Badge className={l.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                        {l.is_active ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(l)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeactivate(l.id, l.is_active)}>
                          <UserMinus className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '노무사 수정' : '노무사 추가'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {(['name', 'reg_no', 'region', 'phone'] as const).map((key) => (
              <div key={key} className="space-y-1">
                <Label>{key === 'name' ? '이름' : key === 'reg_no' ? '등록번호' : key === 'region' ? '지역' : '연락처'}</Label>
                <Input
                  value={form[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
            <Button onClick={handleSave} disabled={saving} className="w-full bg-[#0D2433] hover:bg-[#00A693]">
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
