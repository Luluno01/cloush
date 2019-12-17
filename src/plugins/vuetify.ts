import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import colors from 'vuetify/lib/util/colors'


Vue.use(Vuetify)

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: colors.teal,
        secondary: colors.purple,
        accent: colors.pink,
        error: colors.red,
        info: colors.lightBlue,
        success: colors.green,
        warning: colors.orange
      } as any  // Type bug of Vuetify
    }
  }
})
