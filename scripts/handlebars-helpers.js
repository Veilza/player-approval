/* global Handlebars */

// Define any helpers that'll be useful for working with Handlebars
export const _loadHelpers = async function () {
  // If Equals
  Handlebars.registerHelper('ifeq', function (a, b, options) {
    if (a === b) {
      return options.fn(this)
    }

    return options.inverse(this)
  })
}
