/* global window, game, ui, Hooks, ChatMessage */

import { getApprovalEntity } from './get-approval-entity.js'
import { _loadHelpers } from './handlebars-helpers.js'
import { PlayerApprovalApplication } from './player-approval-application.js'

class PlayerApprovalSystem {
  /**
   * Set up keybindings
   */
  static registerKeybindings () {
    // Register the keybinding for approving of an action
    game.keybindings.register('player-approval', 'approve', {
      name: 'PLAYER_APPROVAL.KEYBINDINGS.APPROVE.Name',
      hint: 'PLAYER_APPROVAL.KEYBINDINGS.APPROVE.Hint',
      editable: [
        {
          key: 'Digit1',
          modifiers: ['Shift']
        }
      ],
      onDown: keybind => this.applyApprovalRating('approve')
    })

    // Register the keybinding for disapproving of an action
    game.keybindings.register('player-approval', 'disapprove', {
      name: 'PLAYER_APPROVAL.KEYBINDINGS.DISAPPROVE.Name',
      hint: 'PLAYER_APPROVAL.KEYBINDINGS.DISAPPROVE.Hint',
      editable: [
        {
          key: 'Digit2',
          modifiers: ['Shift']
        }
      ],
      onDown: keybind => this.applyApprovalRating('disapprove')
    })

    // Register the keybinding for abstaining from an opinion (hiding the popup message)
    game.keybindings.register('player-approval', 'abstain', {
      name: 'PLAYER_APPROVAL.KEYBINDINGS.ABSTAIN.Name',
      hint: 'PLAYER_APPROVAL.KEYBINDINGS.ABSTAIN.Hint',
      editable: [
        {
          key: 'Digit3',
          modifiers: ['Shift']
        }
      ],
      onDown: keybind => this.applyApprovalRating('abstain')
    })

    console.log('Player Approval | Registered module keybindings.')
  }

  /**
   * Class variables
   */
  // Map to track current player approvals
  static currentApprovals = new Map()

  // Timer in milliseconds
  static timeoutDuration = 60 * 1000

  // Various nullable variables
  static approvalUI = null
  static approvalTimer = null
  static approvalInitiator = null

  /**
   * Class functions
   */
  // Function to apply the approval rating
  static applyApprovalRating (rating) {
    // Sanity check for the rating value and prevent malformed data
    const approvalRatings = ['approve', 'disapprove', 'abstain']
    if (!approvalRatings.includes(rating)) {
      ui.notifications.warn(game.i18n.format('PLAYER_APPROVAL.WARNING.NotValidRating', {
        rating
      }))

      return
    }

    const approvalEntity = getApprovalEntity()
    const details = {
      id: game.user.id,
      name: approvalEntity?.name,
      img: approvalEntity?.img,
      isMultiple: approvalEntity?.isMultiple
    }

    // Send to all other clients
    game.socket.emit('module.player-approval', {
      details,
      rating,
      initiator: game.user.id
    })

    // Also apply it locally
    this.receiveApproval(details, rating, game.user.id)

    // Initialize timer if this is the first submission
    if (!this.approvalTimer) {
      this.startApprovalTimer()
    }

    // Update the player's rating
    this.currentApprovals.set(details.id, { details, rating })

    // Refresh the UI display
    this.renderApprovalUI()
  }

  // Receive approval ratings from other clients
  static receiveApproval (details, rating, initiator) {
    // Initialize timer
    if (!this.approvalTimer) {
      this.startApprovalTimer()
    }

    // Update the player's rating
    this.currentApprovals.set(details.id, { details, rating })

    // Store the approval initiator if none is set
    if (!this.approvalInitiator) {
      this.approvalInitiator = initiator
    }

    // Refresh the UI
    this.renderApprovalUI()
  }

  // Start a 1-minute timer for approvals
  static startApprovalTimer () {
    this.approvalTimer = setTimeout(() => {
      // Close the UI
      this.closeApprovalUI()

      // Only post the approval results as the initiator
      // This prevents issues where the results won't post if the GM isn't logged in
      // or it posting multiple times
      if (game.user.id === this.approvalInitiator) {
        this.postApprovalResults()
      }

      // Clear our variables
      this.currentApprovals.clear()
      this.approvalTimer = null
      this.approvalInitiator = null
    }, this.timeoutDuration)
  }

  // Render the approval UI popup
  static renderApprovalUI () {
    if (!this.approvalUI) {
      const items = Array.from(this.currentApprovals.entries()).map(([id, { details, rating }]) => {
        return { details, rating }
      })

      this.approvalUI = new PlayerApprovalApplication()
      this.approvalUI.items = items
      this.approvalUI.render(true)
    } else {
      this.updateApprovalList()
    }
  }

  // Update the content inside the approval popup
  static updateApprovalList () {
    if (this.approvalUI) {
      const items = Array.from(this.currentApprovals.entries()).map(([id, { details, rating }]) => {
        return { details, rating }
      })

      this.approvalUI.items = items
      this.approvalUI.render(false)
    }
  }

  // Close the approval UI
  static closeApprovalUI () {
    if (this.approvalUI) {
      this.approvalUI.close()
      this.approvalUI = null
    }
  }

  // Post the final approval results to chat
  static postApprovalResults () {
    if (this.currentApprovals.size === 0) return

    // Format each list option properly
    const results = Array.from(this.currentApprovals.entries()).reduce((html, [id, { details, rating }]) => {
      // Filter out all 'abstain' votes
      if (rating === 'abstain') return html

      // Localize the approvals and disapprovals
      const localized = rating === 'approve' ? game.i18n.localize('PLAYER_APPROVAL.Approved') : game.i18n.localize('PLAYER_APPROVAL.Disapproved')

      // Return with the new formatting
      return html + `<p><strong>${details.name}</strong> ${localized}.</p>`
    }, '')

    ChatMessage.create({
      content: `<h2>${game.i18n.localize('PLAYER_APPROVAL.ApprovalResults')}</h2>${results}`,
      whisper: []
    })
  }
}

/**
 * Run anything that needs to be done on game start below this line
 */
Hooks.once('init', () => {
  // Initialize the module's keybindings
  PlayerApprovalSystem.registerKeybindings()

  // Initialize Handlebar helpers
  _loadHelpers()
})

Hooks.once('ready', () => {
  // Set up the module's sockets
  game.socket.on('module.player-approval', ({ details, rating, initiator }) => {
    PlayerApprovalSystem.receiveApproval(details, rating, initiator)
  })

  // Register an API that macros/modules/etc can access for basic things
  window.PlayerApproval = {
    API: PlayerApprovalSystem
  }
})
