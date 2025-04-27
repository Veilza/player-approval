/* global foundry, game, PlayerApproval */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class PlayerApprovalApplication extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: ['player-approval'],
    tag: 'form',
    form: {
      submitOnChange: false,
      closeOnSubmit: false
    },
    position: {
      width: 200,
      height: 'auto',
      top: 55,
      left: 115
    },
    window: {
      resizable: true
    },
    actions: {
      applyApprovalRating: PlayerApprovalApplication._onApplyApprovalRating
    }
  }

  // Start the application with the given list of items (players)
  constructor (items = []) {
    super()

    this.items = items
  }

  // Localize the title here instead of the DEFAULT_OPTIONS because i18n doesn't
  // initiate before this application is registered
  get title () {
    return game.i18n.localize('PLAYER_APPROVAL.MODULE_NAME')
  }

  // Set up the template part(s), of which there's only one for now
  static PARTS = {
    form: {
      template: 'modules/player-approval/templates/player-approval-template.hbs'
    }
  }

  // Use our window API to pass our ratings that are given via the buttons on the application
  static _onApplyApprovalRating (event, target) {
    event.preventDefault()

    console.log('EEEEEEEEEEEEEEEE')

    const rating = target.getAttribute('data-rating')

    PlayerApproval.API.applyApprovalRating(rating)
  }

  // Pass the data into the application window
  async _prepareContext () {
    const data = {}

    data.items = this.items

    return data
  }

  // Prevent closing of this window
  // We mainly do this because escape key would close it by accident,
  // and this popup doesn't last long enough for it to be annoying
  async close () {
    return null
  }
}
