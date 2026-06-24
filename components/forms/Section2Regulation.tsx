'use client';
import { UseFormReturn } from 'react-hook-form';
import type { CaseFormValues } from '@/lib/utils/validators';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROVIDERS_LIST } from '@/types';
import { AlertTriangle, Info, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props { form: UseFormReturn<CaseFormValues, any, any> }

type ToggleOption<T extends string> = { value: T; label: string };

function ToggleGroup<T extends string>({
  options, value, onChange
}: { options: ToggleOption<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
            value === o.value
              ? 'border-[#00A693] bg-teal-50 text-teal-800'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Section2Regulation({ form }: Props) {
  const { watch, setValue, formState: { errors } } = form;
  const pensionType      = watch('pension_type');
  const providers        = watch('providers') ?? ['하나은행'];
  const enrollTiming     = watch('enrollment_timing');
  const includeExec      = watch('include_executives');
  const coveragePeriod   = watch('coverage_period');
  const workerRepType    = watch('worker_rep_type');

  function addProvider(p: string | null) {
    if (p && !providers.includes(p)) setValue('providers', [...providers, p]);
  }
  function removeProvider(p: string) {
    if (p === '하나은행') return;
    setValue('providers', providers.filter((x) => x !== p));
  }

  const availableProviders = PROVIDERS_LIST.filter((p) => !providers.includes(p));

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-[#0D2433] border-b pb-2">제도 구분값</h3>

      {/* ① 제도형태 */}
      <Section title="① 제도형태 *">
        <ToggleGroup
          options={[
            { value: 'DB', label: '확정급여형(DB)' },
            { value: 'DC', label: '확정기여형(DC)' },
          ]}
          value={pensionType}
          onChange={(v) => setValue('pension_type', v)}
        />
        {pensionType === 'DB' && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-1">
            DB형: 근로자의 퇴직급여가 사전에 확정되며, 운용책임은 사용자에게 있습니다.
          </div>
        )}
      </Section>

      {/* ② 제도시행일 */}
      <Section title="② 제도시행일 *" error={errors.start_date?.message}>
        <Input type="date" {...form.register('start_date')} className="max-w-xs" />
        <p className="text-xs text-gray-500 mt-1">통상 규약 시행월의 1일로 설정합니다.</p>
      </Section>

      {/* ③ 퇴직연금사업자 */}
      <Section title="③ 퇴직연금사업자 *">
        <div className="flex flex-wrap gap-2">
          {providers.map((p) => (
            <span key={p} className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              p === '하나은행' ? 'bg-[#0D2433] text-white' : 'bg-gray-100 text-gray-700'
            }`}>
              {p}
              {p !== '하나은행' && (
                <button type="button" onClick={() => removeProvider(p)}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
        {availableProviders.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Plus className="w-4 h-4 text-gray-400" />
            <Select onValueChange={addProvider}>
              <SelectTrigger className="w-48 h-8 text-sm">
                <SelectValue placeholder="거래 금융기관 추가" />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {providers.length > 1 && pensionType === 'DB' && (
          <div className="mt-2">
            <Label className="text-sm">간사기관</Label>
            <Select onValueChange={(v: string | null) => { if (v) setValue('lead_institution', v); }}>
              <SelectTrigger className="mt-1 max-w-xs">
                <SelectValue placeholder="간사기관 선택" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </Section>

      {/* ④ 근로자대표 */}
      <Section title="④ 근로자대표 *">
        <ToggleGroup
          options={[
            { value: 'majority', label: '노조 없음 (근로자 과반수)' },
            { value: 'union',    label: '노조 있음 (과반수 노조)' },
          ]}
          value={workerRepType}
          onChange={(v) => setValue('worker_rep_type', v)}
        />
      </Section>

      {/* ⑤ 가입시점 */}
      <Section title="⑤ 가입시점 *">
        <ToggleGroup
          options={[
            { value: 'immediate',   label: '입사 시 즉시' },
            { value: 'after1year',  label: '입사 1년 경과시점' },
          ]}
          value={enrollTiming}
          onChange={(v) => setValue('enrollment_timing', v)}
        />
        {enrollTiming === 'after1year' && (
          <div className="flex items-start gap-2 text-amber-700 bg-amber-50 text-xs p-2 rounded mt-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            하나은행 전산에서 1년 미만 근로자 등록이 불가합니다. 사업장에 반드시 확인하세요.
          </div>
        )}
      </Section>

      {/* ⑥ 임원 포함 여부 */}
      <Section title="⑥ 임원 포함 여부 *">
        <ToggleGroup
          options={[
            { value: 'false', label: '미포함' },
            { value: 'true',  label: '포함' },
          ]}
          value={String(includeExec)}
          onChange={(v) => setValue('include_executives', v === 'true')}
        />
        {includeExec && (
          <div className="flex items-center gap-2 text-blue-700 bg-blue-50 text-xs p-2 rounded mt-1">
            <Info className="w-3.5 h-3.5 shrink-0" />
            임원 포함 시 정관 또는 주주총회 결의가 필요할 수 있습니다.
          </div>
        )}
      </Section>

      {/* ⑦ 퇴직연금 가입기간 */}
      <Section title="⑦ 퇴직연금 가입기간 *">
        <div className="flex gap-2 flex-wrap">
          {([
            { value: 'afterSetup',   label: '시행 이후 근무분' },
            { value: 'includesPast', label: '시행 이전 포함' },
            { value: 'specificDate', label: '특정시점 이후 포함' },
          ] as const).map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setValue('coverage_period', o.value)}
              className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                coveragePeriod === o.value
                  ? 'border-[#00A693] bg-teal-50 text-teal-800'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {coveragePeriod === 'specificDate' && (
          <Input type="date" {...form.register('coverage_date')} className="mt-2 max-w-xs" />
        )}
      </Section>

      {/* DC 전용: 부담금 납입주기 */}
      {pensionType === 'DC' && (
        <Section title="⑧ 부담금 납입주기 (DC) *">
          <ToggleGroup
            options={[
              { value: 'annual',     label: '연납' },
              { value: 'semiannual', label: '반기납' },
              { value: 'quarterly',  label: '분기납' },
              { value: 'monthly',    label: '월납' },
            ]}
            value={watch('payment_cycle') ?? 'annual'}
            onChange={(v) => setValue('payment_cycle', v)}
          />
          <p className="text-xs text-gray-500 mt-1">가급적 연납 선택 권장 (연납 선택해도 월납 가능)</p>
        </Section>
      )}

    </div>
  );
}

function Section({ title, error, children }: { title: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{title}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
