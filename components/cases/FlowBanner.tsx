import type { CaseStatus } from '@/types';
import { STATUS_FLOW } from '@/types';
import { CheckCircle, Circle, XCircle } from 'lucide-react';

interface Props {
  status: CaseStatus;
}

export function FlowBanner({ status }: Props) {
  const isRejected = status === '반려';
  const currentIdx = STATUS_FLOW.indexOf(status);

  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto py-3">
      {STATUS_FLOW.map((s, idx) => {
        const done    = currentIdx > idx;
        const active  = currentIdx === idx && !isRejected;
        const pending = currentIdx < idx;

        return (
          <div key={s} className="flex items-center">
            <div className={`flex flex-col items-center min-w-[90px]`}>
              <div className={`rounded-full p-1 ${
                done   ? 'text-green-600' :
                active ? 'text-teal-600'  : 'text-gray-300'
              }`}>
                {done ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Circle className={`w-6 h-6 ${active ? 'fill-teal-100' : ''}`} />
                )}
              </div>
              <span className={`text-xs mt-1 text-center font-medium ${
                done   ? 'text-green-700' :
                active ? 'text-teal-700'  : 'text-gray-400'
              }`}>{s}</span>
            </div>
            {idx < STATUS_FLOW.length - 1 && (
              <div className={`h-0.5 w-8 mx-1 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
      {isRejected && (
        <div className="flex items-center ml-4">
          <XCircle className="w-6 h-6 text-red-500" />
          <span className="text-xs ml-1 text-red-600 font-medium">반려</span>
        </div>
      )}
    </div>
  );
}
