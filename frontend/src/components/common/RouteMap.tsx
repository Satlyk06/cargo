import { useTranslation } from 'react-i18next'
import { ArrowLongRightIcon, MapPinIcon, TruckIcon } from '@heroicons/react/24/outline'

interface RouteMapProps {
  route: string[]
  routeStatus: boolean[]
  currentRouteIndex: number
}

export default function RouteMap({ route, routeStatus }: RouteMapProps) {
  const { t } = useTranslation()
  const passed = routeStatus.filter(Boolean).length
  const remaining = route.length - passed
  const pct = route.length > 0 ? Math.round((passed / route.length) * 100) : 0
  const isComplete = route.length > 0 && passed === route.length
  const roadProgress = route.length > 1 ? Math.min(100, Math.max(0, ((passed - 1) / (route.length - 1)) * 100)) : pct
  const activeStop = Math.min(Math.max(passed, 0), route.length - 1)

  return (
    <div className="w-full font-sans">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
            <TruckIcon className="h-4 w-4 text-indigo-500" />
          </div>
          <span className="text-sm font-semibold text-slate-700">{t('routeMap.title')}</span>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-600'}`}>
          {isComplete ? `✓ ${t('dashboard.deliveredStatus')}` : `${passed}/${route.length} ${t('shipments.stops')}`}
        </span>
      </div>

      <div className="mb-6 overflow-x-auto pb-2">
        <div className="relative min-w-[540px] px-6 pt-12" style={{ minWidth: `${Math.max(540, route.length * 155)}px` }}>
          <div className="absolute left-6 top-1 flex items-center gap-2 text-[11px] font-semibold text-slate-400">
            <MapPinIcon className="h-4 w-4 text-emerald-500" />
            <span>{route[0]}</span>
          </div>
          <div className="absolute right-6 top-1 flex items-center gap-2 text-[11px] font-semibold text-slate-400">
            <span>{route[route.length - 1]}</span>
            <MapPinIcon className="h-4 w-4 text-rose-500" />
          </div>
          <div className="absolute left-6 right-6 top-[72px] h-12 rounded-full bg-slate-700 shadow-inner" />
          <div className="absolute left-8 right-8 top-[95px] border-t-2 border-dashed border-amber-200/90" />
          <ArrowLongRightIcon className="absolute right-8 top-[84px] z-10 h-6 w-6 text-amber-100" />
          <div className="absolute left-6 top-[72px] h-12 rounded-l-full bg-emerald-500/30 transition-all duration-700" style={{ width: `calc((100% - 48px) * ${roadProgress / 100})` }} />

          <div className="absolute top-[38px] z-20 -translate-x-1/2 transition-all duration-700" style={{ left: `calc(24px + (100% - 48px) * ${roadProgress / 100})` }}>
            <div className="rounded-xl bg-indigo-600 p-2 shadow-lg shadow-indigo-300 ring-4 ring-white">
              <TruckIcon className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="relative z-10 flex justify-between" aria-label="Route progresses from left to right">
            {route.map((stop, index) => {
              const isPassed = Boolean(routeStatus[index])
              const isCurrent = !isComplete && index === activeStop
              const isLast = index === route.length - 1

              return (
                <div key={`${stop}-${index}`} className="flex flex-col items-center gap-2" style={{ width: `${100 / route.length}%`, maxWidth: 140 }}>
                  <div className={`mt-7 flex h-11 w-11 items-center justify-center rounded-full border-4 bg-white shadow-md transition-all ${isPassed ? 'border-emerald-400 bg-emerald-50' : isCurrent ? 'border-indigo-400 bg-indigo-50 ring-4 ring-indigo-100' : isLast ? 'border-rose-300' : 'border-slate-200'}`}>
                    {isPassed ? (
                      <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <MapPinIcon className={`h-5 w-5 ${isCurrent ? 'text-indigo-500' : isLast ? 'text-rose-500' : 'text-slate-300'}`} />
                    )}
                  </div>
                  <span className={`w-full truncate px-1 text-center text-xs font-semibold ${isPassed ? 'text-emerald-600' : isCurrent ? 'text-indigo-600' : 'text-slate-400'}`}>{stop}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isPassed ? 'bg-emerald-50 text-emerald-600' : isCurrent ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                    {isPassed ? `✓ ${t('routeMap.passed2')}` : isCurrent ? `● ${t('routeMap.here')}` : isLast ? t('routeMap.destination') : t('routeMap.waiting')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center"><p className="text-lg font-bold text-emerald-600">{passed}</p><p className="mt-0.5 text-[11px] font-medium text-emerald-500">{t('routeMap.passedCount')}</p></div>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-center"><p className="text-lg font-bold text-indigo-600">%{pct}</p><p className="mt-0.5 text-[11px] font-medium text-indigo-500">{t('routeMap.progress')}</p></div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center"><p className="text-lg font-bold text-slate-500">{remaining}</p><p className="mt-0.5 text-[11px] font-medium text-slate-400">{t('routeMap.remainingCount')}</p></div>
      </div>
    </div>
  )
}
