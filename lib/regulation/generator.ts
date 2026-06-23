import type { CaseFormData } from '@/types';

const CYCLE_TEXT: Record<string, string> = {
  annual:     '매년 말일',
  semiannual: '매반기 말일',
  quarterly:  '매분기 말일',
  monthly:    '매월 말일',
};

const COVERAGE_TEXT: Record<string, (date?: string) => string> = {
  afterSetup:   () => '제도시행일 이후 근무분',
  includesPast: () => '제도시행일 이전 근무분을 포함한 전체 근무분',
  specificDate: (d) => `${d ?? ''} 이후 근무분`,
};

export function generateRegulation(data: CaseFormData): string {
  const isDB = data.pension_type === 'DB';
  const repText = data.worker_rep_type === 'union'
    ? '과반수가 가입한 노동조합'
    : '근로자의 과반수';
  const enrollText = data.enrollment_timing === 'immediate'
    ? '입사일'
    : '계속근로기간 1년이 되는 날';
  const periodText = COVERAGE_TEXT[data.coverage_period](data.coverage_date);
  const cycleText = CYCLE_TEXT[data.payment_cycle ?? 'annual'];
  const hasMultiProvider = data.providers.length > 1;
  const typeStr = isDB ? '확정급여형' : '확정기여형';
  const year = data.start_date.slice(0, 4);

  const art4 = hasMultiProvider && isDB
    ? `제4조(간사기관) 복수의 운용관리기관 중 간사기관은 ${data.lead_institution}으로 한다.\n\n`
    : '';

  const ch5 = isDB
    ? `제9조(급여수준) 가입자의 급여는 계속근로기간 1년에 대하여 30일분의 평균임금에 상당하는 금액으로 한다.`
    : `제9조(부담금) 사용자는 연간 임금총액의 12분의 1 이상을 부담금으로 납입한다.\n제10조(납입주기) 사용자는 ${cycleText}까지 부담금을 납입한다.`;

  return `${typeStr}퇴직연금제도 규약
제정 ${year}년

제1장 총칙
제1조(명칭) 이 규약은 ${data.company_name}의 ${typeStr}퇴직연금제도규약이라 한다.
제2조(목적) 「근로자퇴직급여 보장법」 제13조에 따라 ${typeStr}퇴직연금제도의 설정 및 운영에 관한 사항을 정한다.

제2장 퇴직연금사업자 선정
제3조(운용관리기관) 사용자는 다음의 퇴직연금사업자를 운용관리기관으로 선정한다.
    ${data.providers.join(', ')}
${art4}
제3장 가입자
제5조(근로자대표) 이 규약에서 근로자대표란 ${repText}을 말한다.
제6조(가입시점) ${enrollText}을 가입자 자격 취득일로 본다.
제7조(임원포함) ${data.include_executives ? '임원을 가입 대상에 포함한다.' : '임원은 가입 대상에서 제외한다.'}

제4장 가입기간
제8조(가입기간) ${periodText}을 가입기간으로 한다.

제5장 급여 및 부담금
${ch5}

부칙
이 규약은 ${data.start_date}부터 시행한다.

${data.company_name} 대표 ${data.ceo_name} (인)
근로자대표: _________________ (인)`.trim();
}
