import { NewFileModalProps } from '@/types'
import CodeMirror from '@uiw/react-codemirror'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { javascript } from '@codemirror/lang-javascript'

export default function NewFileModal(props: NewFileModalProps) {
  const {
    isOpen,
    fileName,
    fileContent,
    onClose,
    onFileNameChange,
    onFileContentChange,
    onCreate
  } = props

  if (!isOpen) return null

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h3>New File</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>File Name</label>
            <input
              type="text"
              className="form-control"
              value={fileName}
              onChange={(e) => onFileNameChange(e.target.value)}
              placeholder="example.txt"
            />
          </div>

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label>Content</label>
            <CodeMirror
              value={fileContent}
              height="300px"
              theme={vscodeDark}
              extensions={[javascript({ jsx: true })]}
              onChange={(value) => onFileContentChange(value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onCreate}>Create</button>
        </div>
      </div>
    </div>
  )
}
