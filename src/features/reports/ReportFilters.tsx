import type { ReportPeriod } from './types'

const periodLabels: Record<ReportPeriod, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
}

interface ReportFiltersProps {
  onChange: (period: ReportPeriod) => void
  period: ReportPeriod
}

export function ReportFilters({ onChange, period }: ReportFiltersProps) {
  return (
    <div aria-label="Report period" className="report-period-filters" role="group">
      {(Object.keys(periodLabels) as ReportPeriod[]).map((value) => (
        <button
          aria-pressed={period === value}
          className={`report-period-button${period === value ? ' is-active' : ''}`}
          key={value}
          onClick={() => onChange(value)}
          type="button"
        >
          {periodLabels[value]}
        </button>
      ))}
    </div>
  )
}
