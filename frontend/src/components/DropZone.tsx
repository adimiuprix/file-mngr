import { DropZoneProps } from '@/types'

export default function DropZone({ isVisible }: DropZoneProps) {
  if (!isVisible) return null

  return (
    <div className="drop-zone active">
      <div className="drop-zone-content">
        <div className="drop-zone-icon">📤</div>
        <div className="drop-zone-text">Drop files here to upload</div>
        <div className="drop-zone-hint">Release to start uploading</div>
      </div>
    </div>
  )
}