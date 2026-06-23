import { Badge } from '@/components/ui/badge';
import type { CaseStatus } from '@/types';
import { STATUS_COLORS } from '@/types';

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <Badge className={`${STATUS_COLORS[status]} border-0 font-medium text-xs`}>
      {status}
    </Badge>
  );
}
