import React, { useState } from 'react'
import { Share } from 'lucide-react'
import ShareModal from './ShareModal'

const ShareButton = () => {
  const [showModal, setShowModal] = useState(false)

  const handleShareClick = () => {
    setShowModal(true)
  }

  return (
    <>
      <button
        onClick={handleShareClick}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-solarized-blue text-solarized-base3 rounded-lg text-xs sm:text-sm font-medium hover:bg-solarized-cyan transition-colors shadow-sm whitespace-nowrap"
        aria-label="共有"
      >
        <Share className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-2" />
        <span className="text-xs sm:text-sm">共有</span>
      </button>

      <ShareModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}

export default ShareButton