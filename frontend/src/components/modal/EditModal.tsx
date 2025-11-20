import { EditModalProps } from '@/types'
import CodeMirror from '@uiw/react-codemirror'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { javascript } from '@codemirror/lang-javascript'

export default function EditModal(props: EditModalProps) {
  const { isOpen, title, content, onClose, onContentChange, onSave } = props

  if (!isOpen) return null

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <CodeMirror
            value={content}
            height="300px"
            theme={vscodeDark}
            extensions={[javascript({ jsx: true })]}
            onChange={(value) => onContentChange(value)}
          />
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
