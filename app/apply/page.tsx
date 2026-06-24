'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Home, Upload, CheckCircle, Loader2, Send, FileText, Users, Building2,
} from 'lucide-react';
import { formatBizRegNo } from '@/lib/utils/formatters';

interface UploadedFile {
  file: File;
  path?: string;
  uploading: boolean;
  done: boolean;
}

const FILE_FIELDS = [
  {
    key:    'biz_reg'  as const,
    label:  '사업자등록증',
    icon:   Building2,
    accept: 'application/pdf,image/*',
  },
  {
    key:    'consent'  as const,
    label:  '근로자대표 동의서',
    icon:   Users,
    accept: 'application/pdf,image/*',
  },
  {
    key:    'report'   as const,
    label:  '퇴직연금 규약 신청서',
    icon:   FileText,
    accept: 'application/pdf,image/*',
  },
] as const;

type FileKey = typeof FILE_FIELDS[number]['key'];

export default function ApplyPage() {
  const supabase = createClient();

  // 사업장 / 대표 정보
  const [companyName, setCompanyName] = useState('');
  const [bizRegNo,    setBizRegNo]    = useState('');
  const [repName,     setRepName]     = useState('');
  const [repPhone,    setRepPhone]    = useState('');

  // 파일 업로드 상태
  const [files, setFiles] = useState<Partial<Record<FileKey, UploadedFile>>>({});

  const [submitting, setSubmitting] = useState(false);
  const [caseId,     setCaseId]     = useState<string | null>(null);

  // 파일 업로드 처리
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>, key: FileKey) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFiles((prev) => ({ ...prev, [key]: { file, uploading: true, done: false } }));

    const id  = `C${Date.now()}`;
    const ext = file.name.split('.').pop();
    const path = `${id}/${key}.${ext}`;

    try {
      const { error } = await supabase.storage
        .from('documents1')
        .upload(path, file, { upsert: true });
      if (error) throw error;

      setFiles((prev) => ({
        ...prev,
        [key]: { file, path, uploading: false, done: true },
      }));
      toast.success(`${FILE_FIELDS.find((f) => f.key === key)?.label} 업로드 완료`);
    } catch (err: any) {
      toast.error(err.message ?? '업로드 실패');
      setFiles((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  const allUploaded = FILE_FIELDS.every((f) => files[f.key]?.done);
  const canSubmit   = companyName.trim() && bizRegNo.trim() && repName.trim() && repPhone.trim() && allUploaded;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      toast.warning('모든 항목을 입력하고 파일을 모두 업로드해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const id = Object.values(files)[0]?.path?.split('/')[0] ?? `C${Date.now()}`;

      const { error } = await supabase.from('cases').insert({
        id,
        company_name:        companyName,
        biz_reg_no:          bizRegNo,
        ceo_name:            repName,
        ceo_phone:           repPhone,
        // 필수 컬럼 기본값
        address:             '-',
        employee_count:      0,
        fiscal_month:        12,
        business_type:       'corporation',
        pension_type:        'DB',
        start_date:          new Date().toISOString().slice(0, 10),
        providers:           ['하나은행'],
        worker_rep_type:     'majority',
        enrollment_timing:   'immediate',
        include_executives:  false,
        coverage_period:     'afterSetup',
        worker_rep_consent:  true,
        hana_branch:         '-',
        hana_manager:        '-',
        doc_biz_reg_path:    files.biz_reg?.path,
        doc_consent_path:    files.consent?.path,
        doc_report_path:     files.report?.path,
        status:              '검토대기',
        sent_at:             new Date().toISOString(),
        delay_flag:          false,
        settled:             false,
      });
      if (error) throw error;

      // 구글 스프레드시트 전송 (실패해도 신청은 완료)
      fetch('/api/notify-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          company_name:     companyName,
          biz_reg_no:       bizRegNo,
          ceo_name:         repName,
          ceo_phone:        repPhone,
          doc_biz_reg_path: files.biz_reg?.path ?? '',
          doc_consent_path: files.consent?.path ?? '',
          doc_report_path:  files.report?.path ?? '',
          status:           '검토대기',
          sent_at:          new Date().toLocaleString('ko-KR'),
        }),
      }).catch(() => {/* 스프레드시트 오류는 무시 */});

      setCaseId(id);
      toast.success('신청이 접수되었습니다!');
    } catch (err: any) {
      toast.error(err.message ?? '제출 실패');
    } finally {
      setSubmitting(false);
    }
  }

  // ── 접수 완료 화면 ──────────────────────────────────────────
  if (caseId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-5 max-w-sm w-full">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-11 h-11 text-[#00A693]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0D2433]">신청 접수 완료</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            당직 노무사가 서류를 검토한 후<br />
            관할 노동지청에 팩스로 제출합니다.
          </p>
          <div className="bg-gray-100 rounded-xl p-4 text-sm">
            <p className="text-gray-400 text-xs mb-1">접수번호</p>
            <p className="font-mono font-bold text-[#0D2433] text-lg">{caseId}</p>
            <p className="text-gray-400 text-xs mt-2">
              진행현황 조회 시 사업자등록번호와<br />
              뒤 4자리(비밀번호)를 사용하세요.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/track">
              <Button className="bg-[#00A693] hover:bg-[#007a6b]">진행현황 조회</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">홈으로</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── 신청 폼 ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 바 */}
      <header className="bg-[#00A693] h-14 flex items-center px-5 gap-3 sticky top-0 z-10">
        <Link href="/" className="text-white/70 hover:text-white transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        <span className="text-white/40">/</span>
        <span className="text-white text-sm font-medium">패스트트랙 신청</span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-[#0D2433]">퇴직연금 패스트트랙 신청</h1>
          <p className="text-sm text-gray-400 mt-1">
            서류 제출 후 노무사 검토 → 노동지청 팩스 접수가 자동으로 진행됩니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ① 사측 대표 정보 */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0D2433] flex items-center gap-2">
              <span className="w-5 h-5 bg-[#0D2433] text-white rounded-full text-xs flex items-center justify-center">1</span>
              사측 대표 정보
            </h2>

            <div className="space-y-1">
              <Label htmlFor="companyName">사업장명 <span className="text-red-400">*</span></Label>
              <Input
                id="companyName"
                placeholder="사업자등록증의 상호명"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="bizRegNo">사업자등록번호 <span className="text-red-400">*</span></Label>
              <Input
                id="bizRegNo"
                placeholder="000-00-00000"
                value={bizRegNo}
                maxLength={12}
                onChange={(e) => setBizRegNo(formatBizRegNo(e.target.value))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="repName">대표자 이름 <span className="text-red-400">*</span></Label>
                <Input
                  id="repName"
                  placeholder="홍길동"
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="repPhone">대표자 전화번호 <span className="text-red-400">*</span></Label>
                <Input
                  id="repPhone"
                  placeholder="010-0000-0000"
                  value={repPhone}
                  onChange={(e) => setRepPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          </section>

          {/* ② 서류 업로드 */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0D2433] flex items-center gap-2">
              <span className="w-5 h-5 bg-[#0D2433] text-white rounded-full text-xs flex items-center justify-center">2</span>
              서류 업로드 <span className="text-gray-400 font-normal">(PDF · JPG · PNG)</span>
            </h2>

            <div className="space-y-3">
              {FILE_FIELDS.map(({ key, label, icon: Icon, accept }) => {
                const state = files[key];
                const isDone = state?.done;
                const isUploading = state?.uploading;

                return (
                  <label
                    key={key}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isDone
                        ? 'border-[#00A693] bg-teal-50'
                        : 'border-dashed border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isDone ? 'bg-[#00A693]' : 'bg-gray-100'
                    }`}>
                      {isDone
                        ? <CheckCircle className="w-5 h-5 text-white" />
                        : isUploading
                        ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        : <Icon className="w-5 h-5 text-gray-400" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDone ? 'text-[#007a6b]' : 'text-gray-700'}`}>
                        {label}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {isDone
                          ? state.file.name
                          : isUploading
                          ? '업로드 중...'
                          : '파일을 선택하세요'
                        }
                      </p>
                    </div>

                    {!isDone && !isUploading && (
                      <Upload className="w-4 h-4 text-gray-400 shrink-0" />
                    )}

                    <input
                      type="file"
                      accept={accept}
                      className="hidden"
                      onChange={(e) => handleFile(e, key)}
                      disabled={isUploading}
                    />
                  </label>
                );
              })}
            </div>

            {/* 업로드 진행 표시 */}
            <div className="flex gap-1 pt-1">
              {FILE_FIELDS.map(({ key, label }) => (
                <div
                  key={key}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    files[key]?.done ? 'bg-[#00A693]' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center">
              {FILE_FIELDS.filter((f) => files[f.key]?.done).length} / {FILE_FIELDS.length} 완료
            </p>
          </section>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            disabled={!canSubmit || submitting}
            className={`w-full h-12 text-base font-semibold transition-all ${
              canSubmit
                ? 'bg-[#00A693] hover:bg-[#007a6b] text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting
              ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />접수 중...</>
              : <><Send className="w-5 h-5 mr-2" />노무사회로 신청 전송</>
            }
          </Button>

          {!canSubmit && (
            <p className="text-xs text-center text-gray-400">
              모든 정보 입력 및 파일 3건 업로드 후 제출 가능합니다
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
