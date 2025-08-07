/* global game */

export function getApprovalEntity () {
  const user = game?.user
  const controlledTokens = game?.canvas?.tokens?.controlled

  const approvalEntity = {
    name: '',
    img: '',
    isMultiple: false
  }

  /**
   * Primary idea behind the following logic:
   * 1. We prioritize a user's assigned character first
   * 2. If no character is assigned to the user, then we prioritize a selected token (if any is present)
   * 3. Then, as a fallback, we use the user's set name and avatar
   */
  if (user?.character != null) {
    approvalEntity.name = user?.character?.name
    approvalEntity.img = user?.character?.img
  } else {
    if (controlledTokens.length > 0) {
      if (controlledTokens.length === 1) {
        approvalEntity.name = controlledTokens[0]?.document?.name
        approvalEntity.img = controlledTokens[0]?.document?.actor?.img
      } else {
        approvalEntity.name = game.i18n.localize('PLAYER_APPROVAL.ManyCharacters')
        approvalEntity.img = approvalEntity.img = controlledTokens[0]?.document?.actor?.img
        approvalEntity.isMultiple = true
      }
    } else {
      approvalEntity.name = user?.name
      approvalEntity.img = user?.avatar
    }
  }

  return approvalEntity
}
