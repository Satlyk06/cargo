import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface QRCodeDisplayProps {
  trackingCode: string
  qrCode: string
  shipmentData?: {
    senderName: string
    receiverName: string
    receiverPhone: string
    weight: number
    route: string[]
  }
  size?: number
  showModal?: boolean
}

export default function QRCodeDisplay({
  trackingCode,
  qrCode,
  shipmentData,
  showModal = false,
}: QRCodeDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(showModal)
  const [isHovered, setIsHovered] = useState(false)

  const handleDownload = () => {
    try {
      const link = document.createElement('a')
      link.download = `QR-${trackingCode}.png`
      link.href = qrCode
      link.click()
      toast.success('✅')
    } catch {
      toast.error('❌')
    }
  }

  const qrContent = qrCode?.startsWith('data:image')
    ? qrCode
    : JSON.stringify({ trackingCode, ...shipmentData })

  return (
    <>
      {/* Trigger button - Daha şık */}
      <button
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="
          relative w-14 h-14 rounded-2xl
          bg-gradient-to-br from-indigo-50 to-white
          border-2 border-indigo-100
          hover:border-indigo-400 hover:shadow-lg
          flex items-center justify-center
          transition-all duration-300 ease-out
          group
        "
        style={{
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isHovered ? '0 8px 30px rgba(99, 102, 241, 0.15)' : 'none',
        }}
      >
        {qrCode ? (
          <img
            src={qrCode}
            alt={`QR ${trackingCode}`}
            className="w-10 h-10 object-contain rounded-lg transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        )}

        {/* QR Badge */}
        <span className="
          absolute -top-2 -right-2
          w-6 h-6 rounded-full
          bg-gradient-to-r from-indigo-500 to-purple-500
          text-white text-[9px] font-bold
          flex items-center justify-center
          shadow-lg
          transition-all duration-300
          group-hover:scale-110 group-hover:shadow-indigo-300
        ">
          QR
        </span>

        {/* Hover glow effect */}
        <span className="
          absolute inset-0 rounded-2xl
          bg-gradient-to-r from-indigo-400/0 via-indigo-400/0 to-indigo-400/0
          transition-all duration-500
          group-hover:from-indigo-400/10 group-hover:via-indigo-400/5 group-hover:to-purple-400/10
        " />
      </button>

      {/* Modal - Modern ve Şık */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ animation: 'fadeIn .25s ease-out' }}
        >
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/60 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Card - Glassmorphism */}
          <div
            className="relative bg-white/95 backdrop-blur-xl rounded-3xl max-w-sm w-full shadow-2xl border border-white/20 overflow-hidden"
            style={{ 
              animation: 'scaleIn .3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative gradient top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r " />

            {/* Header with gradient */}
            <div className="relative px-6 pt-6 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                 {trackingCode}
                </h2>
              
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all duration-200 hover:scale-110"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* QR Code with glow */}
            <div className="relative px-6 pb-3 flex justify-center">
              <div className="relative p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 shadow-inner">
                {/* Glow effect behind QR */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400/20 via-purple-400/20 to-pink-400/20 blur-2xl" />
                
                <div className="relative">
                  {qrCode ? (
                    <img
                      src={qrCode}
                      alt={`QR ${trackingCode}`}
                      className="w-56 h-56 object-contain rounded-xl"
                    />
                  ) : (
                    <QRCodeSVG
                      value={qrContent}
                      size={224}
                      level="H"
                      includeMargin
                      bgColor="#ffffff"
                      fgColor="#4f46e5"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Actions - Şık butonlar */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleDownload}
                className="
                  flex-1 flex items-center justify-center gap-2
                  py-3 px-4 rounded-xl
                  bg-gradient-to-r from-indigo-500 to-indigo-600
                  hover:from-indigo-600 hover:to-indigo-700
                  active:scale-[0.97]
                  text-white text-sm font-semibold
                  transition-all duration-200
                  shadow-lg shadow-indigo-500/25
                  hover:shadow-indigo-500/40
                "
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(trackingCode)
                  toast.success('📋')
                }}
                className="
                  flex-1 flex items-center justify-center gap-2
                  py-3 px-4 rounded-xl
                  bg-slate-100 hover:bg-slate-200
                  active:scale-[0.97]
                  text-slate-700 text-sm font-semibold
                  transition-all duration-200
                "
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              
              </button>
            </div>

            {/* Decorative bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r " />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale(0.9) translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
      `}</style>
    </>
  )
}