import { useTranslation } from 'react-i18next'
import { TruckIcon } from '@heroicons/react/24/outline'

interface RouteMapProps {
  route: string[]
  routeStatus: boolean[]
  currentRouteIndex: number
}

export default function RouteMap({ route, routeStatus, currentRouteIndex }: RouteMapProps) {
  const { t } = useTranslation()

  const passed    = routeStatus.filter(Boolean).length
  const remaining = route.length - passed
  const pct       = route.length > 0 ? Math.round((passed / route.length) * 100) : 0
  const isComplete = pct === 100

  return (
    <div className="w-full font-sans">

      {/* Başlık */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <TruckIcon className="h-4 w-4 text-indigo-500" />
          </div>
          <span className="text-sm font-semibold text-slate-700">{t('routeMap.title')}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: isComplete ? '#d1fae5' : '#eef2ff',
            color: isComplete ? '#065f46' : '#4f46e5',
          }}
        >
          {isComplete ? '✓' : `%${pct}`} &nbsp;
          {isComplete ? t('dashboard.deliveredStatus') : `${passed}/${route.length} ${t('shipments.stops')}`}
        </div>
      </div>

      {/* Yatay Timeline */}
      <div className="relative mb-6">

        {/* Arka plan çizgisi */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-100 z-0" />

        {/* İlerleme çizgisi */}
        <div
          className="absolute top-5 left-0 h-0.5 z-0 transition-all duration-700"
          style={{
            width: route.length > 1
              ? `${(Math.max(0, passed - 1) / (route.length - 1)) * 100}%`
              : pct === 100 ? '100%' : '0%',
            background: isComplete
              ? '#10b981'
              : 'linear-gradient(90deg, #10b981, #6366f1)',
          }}
        />

        {/* Duraklar */}
        <div className="relative z-10 flex justify-between">
          {route.map((stop, i) => {
            const isPassed  = routeStatus[i]
            const isCurrent = currentRouteIndex === i && !isPassed
            const isLast    = i === route.length - 1

            return (
              <div key={i} className="flex flex-col items-center gap-2"
                style={{ width: `${100 / route.length}%`, maxWidth: 120 }}
              >
                {/* Nokta */}
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  border-2 transition-all duration-300 bg-white
                  ${isPassed
                    ? 'border-emerald-400 bg-emerald-50'
                    : isCurrent
                      ? 'border-indigo-400 bg-indigo-50 ring-4 ring-indigo-100 animate-pulse'
                      : 'border-slate-200 bg-white'
                  }
                `}>
                  {isPassed ? (
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isCurrent ? (
                    <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="5" />
                    </svg>
                  ) : isLast ? (
                    <span className="text-lg leading-none">🎯</span>
                  ) : (
                    <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  )}
                </div>

                {/* Durak adı */}
                <span className={`
                  text-xs font-semibold text-center leading-tight px-1 truncate w-full text-center
                  ${isPassed  ? 'text-emerald-600' :
                    isCurrent ? 'text-indigo-600'  : 'text-slate-400'}
                `}>
                  {stop}
                </span>

                {/* Durum badge */}
                <span className={`
                  text-[10px] font-medium px-2 py-0.5 rounded-full
                  ${isPassed
                    ? 'bg-emerald-50 text-emerald-600'
                    : isCurrent
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-slate-50 text-slate-400'
                  }
                `}>
                  {isPassed  ? `✓ ${t('routeMap.passed2')}` :
                   isCurrent ? `◉ ${t('routeMap.here')}` :
                   isLast    ? t('routeMap.destination') :
                   t('routeMap.waiting')}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Alt özet */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-emerald-600">{passed}</p>
          <p className="text-[11px] text-emerald-500 font-medium mt-0.5">{t('routeMap.passedCount')}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-indigo-600">%{pct}</p>
          <p className="text-[11px] text-indigo-500 font-medium mt-0.5">{t('routeMap.progress')}</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-slate-500">{remaining}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t('routeMap.remainingCount')}</p>
        </div>
      </div>

    </div>
  )
}