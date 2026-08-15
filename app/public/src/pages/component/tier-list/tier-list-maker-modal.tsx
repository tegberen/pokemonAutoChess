import { t } from "i18next"
import type { Dispatch, SetStateAction } from "react"
import { Modal } from "../modal/modal"
import TierListMaker from "./tier-list-maker"

export default function TierListMakerModal(props: {
  show: boolean
  handleClose: Dispatch<SetStateAction<void>>
}) {
  // Modal renders nothing while hidden, but React builds its children first
  if (!props.show) return null

  return (
    <Modal
      show={props.show}
      onClose={props.handleClose}
      header={t("gadget.tier_list_maker")}
      className="tier-list-maker-modal"
    >
      <TierListMaker />
    </Modal>
  )
}
