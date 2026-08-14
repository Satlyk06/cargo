import { useTranslation } from 'react-i18next'
import { Menu, Transition } from '@headlessui/react'
import { Fragment, useEffect } from 'react'
import { GlobeAltIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'

const languages = [
  { code: 'tm', name: 'Türkmençe', flag: '🇹🇲' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan dili al
    const savedLanguage = localStorage.getItem('language')
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage)
    }
  }, [])

  const changeLanguage = (code: string) => {
    console.log('🌐 Dil değiştiriliyor:', code)
    i18n.changeLanguage(code)
    localStorage.setItem('language', code)
    // Sayfayı yenile - çevirilerin tamamen güncellenmesi için
  //  window.location.reload() 
  }

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0]

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 w-9 h-9 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5">
        <GlobeAltIcon className="h-4 w-4 text-slate-400" />
        <span className="hidden sm:inline-flex ml-1.5 pr-1.5 border-r border-slate-200 text-[10px] font-bold tracking-wide text-indigo-500">
          {currentLang.code.toUpperCase()}
        </span>
        <span className="hidden sm:block text-xs font-medium text-slate-600 ml-1">
          {currentLang.name}
        </span>
        <ChevronDownIcon className="hidden sm:block h-3.5 w-3.5 text-slate-400 ui-open:rotate-180 transition-transform duration-200 ml-1" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 sm:scale-95 sm:translate-y-1"
        enterTo="opacity-100 sm:scale-100 sm:translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 sm:scale-100 sm:translate-y-0"
        leaveTo="opacity-0 sm:scale-95 sm:translate-y-1"
      >
        <Menu.Items className="fixed top-[4.5rem] left-1/2 -translate-x-1/2 w-[min(calc(100vw-2rem),13rem)] sm:absolute sm:top-auto sm:left-auto sm:translate-x-0 sm:right-0 sm:mt-2 sm:w-52 origin-top-right rounded-xl bg-white border border-slate-200 shadow-lg shadow-slate-200/60 focus:outline-none z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
          <div className="px-3.5 py-2.5 border-b border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              
            </p>
          </div>
          <div className="p-1.5 space-y-0.5">
            {languages.map(lang => {
              const isActive = i18n.language === lang.code
              return (
                <Menu.Item key={lang.code}>
                  {({ active }) => (
                    <button
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600'
                          : active
                            ? 'bg-slate-50 text-slate-700'
                            : 'text-slate-600'
                      }`}
                    >
                      <span className="text-xl w-7 text-center flex-shrink-0 leading-none">
                        {lang.flag}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-none">{lang.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">
                          {lang.code}
                        </p>
                      </div>
                      {isActive && <CheckIcon className="h-4 w-4 text-indigo-500 flex-shrink-0" />}
                    </button>
                  )}
                </Menu.Item>
              )
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
