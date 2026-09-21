import type { ReactNode } from 'react'

interface PageTitleProps {
  eyebrow?: string
  title: string
  meta?: string
  actions?: ReactNode
}

export function PageTitle({ eyebrow, title, meta, actions }: PageTitleProps) {
  return (
    <div className="page-head reveal">
      <div className="page-title">
        {eyebrow ? <p className="page-title__eyebrow">{eyebrow}</p> : null}
        <h1 className="page-title__heading">{title}</h1>
        {meta ? <p className="page-title__meta">{meta}</p> : null}
      </div>
      {actions ? <div className="page-head__actions">{actions}</div> : null}
    </div>
  )
}
