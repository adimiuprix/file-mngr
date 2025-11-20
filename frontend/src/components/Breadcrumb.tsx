import { FC } from 'react'

interface BreadcrumbProps {
  currentPath: string
  loadFiles: (path: string) => void
}

const Breadcrumb: FC<BreadcrumbProps> = ({ currentPath = '', loadFiles }) => {

  const renderBreadcrumb = () => {
    const parts = currentPath.split('/').filter(Boolean)

    const crumbs = [
      <button
        key="home"
        onClick={() => loadFiles('')}
        className="breadcrumb-link"
      >
        🏠 Home
      </button>
    ]

    let path = ''

    parts.forEach((part, idx) => {
      path += (path ? '/' : '') + part
      const p = path

      crumbs.push(
        <span key={`sep-${idx}`}> / </span>,
        <button
          key={p}
          onClick={() => loadFiles(p)}
          className="breadcrumb-link"
        >
          {part}
        </button>
      )
    })

    return crumbs
  }

  return (
    <div className="breadcrumb">
      {renderBreadcrumb()}
    </div>
  )
}

export default Breadcrumb
