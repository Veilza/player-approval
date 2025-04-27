/* global foundry */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class PlayerApprovalApplication extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    tag: 'form',
    form: {
      handler: PlayerApprovalApplication.myFormHandler,
      submitOnChange: false,
      closeOnSubmit: false
    },
    resizable: true,
    width: 500,
    height: 'auto',
    classes: ['player-approval']
  }

  static PARTS = {
    form: {
      template: 'modules/player-approval/templates/player-approval-template.hbs'
    }
  }

  constructor (items = []) {
    super()

    this.items = items
  }

  getData () {
    return {
      items: this.items
    }
  }

  async applyApprovalRating (rating) {
    window.PlayerApproval.API.applyApprovalRating(rating)
    this.close()
  }

  async _prepareContext () {
    const data = {}

    data.items = this.items

    return data
  }

  activateListeners (html) {
    super.activateListeners(html)

    html.find('[data-action="apply-approval"]').click(ev => {
      const rating = ev.currentTarget.dataset.rating
      this.applyApprovalRating(rating)
    })
  }
}
