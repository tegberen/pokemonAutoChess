import type React from "react"
import { useEffect, useRef } from "react"
import ReactDOM from "react-dom"
import { useTranslation } from "react-i18next"
import { cc } from "../../utils/jsx"
import "./modal.css"

interface ModalProps {
  show: boolean
  onClose?: () => boolean | void
  className?: string
  header?: React.ReactElement | string
  body?: React.ReactElement | string
  footer?: React.ReactElement
  children?: React.ReactElement | React.ReactElement[]
  confirmText?: string
}

export function Modal(props: ModalProps) {
  const {
    show,
    onClose = () => {},
    className = "",
    children,
    confirmText,
    header,
    body,
    footer
  } = props
  const ref = useRef<HTMLDialogElement | null>(null)
  const { t } = useTranslation()

  const close = () => {
    if (ref.current?.open && onClose() !== false) {
      ref.current?.close()
    }
  }

  useEffect(() => {
    if (show) {
      ref.current?.showModal()
    } else {
      close()
    }
  }, [show])

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDialogElement>
  ) => {
    const dialog = ref.current
    if (!dialog) return

    const rect = dialog.getBoundingClientRect()
    const startedInside =
      rect.top <= event.clientY &&
      event.clientY <= rect.bottom &&
      rect.left <= event.clientX &&
      event.clientX <= rect.right
    const startedOnNativeControl = ["OPTION", "SELECT", "BUTTON"].includes(
      (event.target as HTMLElement).tagName
    )

    if (!startedInside && !startedOnNativeControl) {
      close()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    event.stopPropagation()
    if (event.key === "Escape") {
      close()
    }
  }

  return show
    ? ReactDOM.createPortal(
        <dialog
          ref={ref}
          onCancel={close}
          className={cc("modal", "my-container", className)}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
        >
          {header && (
            <header>
              {header}
              <button className="close-btn" onClick={close}>
                🗙
              </button>
            </header>
          )}
          <div className="modal-body">{body || children}</div>
          {(footer || confirmText) && (
            <footer>
              {footer}
              {confirmText && (
                <>
                  <button className="secondary" onClick={close}>
                    {t("close")}
                  </button>
                  <button className="primary" onClick={close}>
                    {confirmText}
                  </button>
                </>
              )}
            </footer>
          )}
        </dialog>,
        document.querySelector("#modal-root")!
      )
    : null
}
