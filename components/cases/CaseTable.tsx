'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CaseStatusBadge } from './CaseStatusBadge';
import type { Case } from '@/types';
import { formatDateTime } from '@/lib/utils/formatters';
import { AlertTriangle } from 'lucide-react';

interface Props {
  cases: Case[];
  onRowClick?: (c: Case) => void;
  showLawyer?: boolean;
}

export function CaseTable({ cases, onRowClick, showLawyer = false }: Props) {
  if (cases.length === 0) {
    return <p className="text-center text-gray-400 py-8">조회된 건이 없습니다.</p>;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#0D2433] hover:bg-[#0D2433]">
            <TableHead className="text-white">접수번호</TableHead>
            <TableHead className="text-white">사업장명</TableHead>
            <TableHead className="text-white">사업자번호</TableHead>
            <TableHead className="text-white">제도</TableHead>
            {showLawyer && <TableHead className="text-white">담당노무사</TableHead>}
            <TableHead className="text-white">지점</TableHead>
            <TableHead className="text-white">전송일시</TableHead>
            <TableHead className="text-white">상태</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((c) => (
            <TableRow
              key={c.id}
              className={`cursor-pointer hover:bg-gray-50 ${c.delay_flag ? 'bg-red-50' : ''}`}
              onClick={() => onRowClick?.(c)}
            >
              <TableCell className="font-mono text-xs">{c.id}</TableCell>
              <TableCell className="font-medium">
                {c.delay_flag && <AlertTriangle className="inline w-3 h-3 text-red-500 mr-1" />}
                {c.company_name}
              </TableCell>
              <TableCell className="text-gray-500 text-sm">{c.biz_reg_no}</TableCell>
              <TableCell>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  c.pension_type === 'DB' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                }`}>{c.pension_type}</span>
              </TableCell>
              {showLawyer && <TableCell className="text-sm">{c.assigned_lawyer_id ?? '-'}</TableCell>}
              <TableCell className="text-sm">{c.hana_branch}</TableCell>
              <TableCell className="text-xs text-gray-500">{formatDateTime(c.sent_at)}</TableCell>
              <TableCell><CaseStatusBadge status={c.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
