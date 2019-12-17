import Vue from 'vue'
import VueRouter from 'vue-router'
import Consoles from '@/views/Consoles.vue'
import ServerList from '@/views/ServerList.vue'
import CredentialStorage from '@/views/CredentialStorage.vue'


export enum View {
  CREDENTIAL_STORAGE = 'credential-storage',
  ADD_SERVER = 'add-server',
  SERVER_LIST = 'server-list',
  CONSOLES = 'consoles'
}

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: View.CREDENTIAL_STORAGE,
    component: CredentialStorage,
    alias: '/' + View.CREDENTIAL_STORAGE
  },
  {
    path: '/' + View.CONSOLES,
    name: View.CONSOLES,
    component: Consoles
  },
  {
    path: '/' + View.SERVER_LIST,
    name: View.SERVER_LIST,
    component: ServerList
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
