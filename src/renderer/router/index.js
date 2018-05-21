import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

let router = new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: require('@/components/LandingPage').default
    },
    {
      path: '/library',
      component: require('@/components/Library/LandingPage').default,
      children: [
        {
          path: '',
          name: 'library-landing-page',
          component: require('@/components/Library/PreviewsPage').default
        },
        {
          path: 'all',
          name: 'library-all-songs-page',
          component: require('@/components/Library/AllSongsPage').default
        },
        {
          path: 'album/:album?',
          name: 'library-album-page',
          component: require('@/components/Library/AlbumPage').default
        }
      ]
    },
    {
      path: '/settings',
      component: require('@/components/Settings/Index.vue').default,
      children: [
        {
          path: '',
          name: 'settings-page',
          component: require('@/components/Settings/All.vue').default
        },
        {
          path: 'library',
          name: 'settings-library-page',
          component: require('@/components/Settings/Library.vue').default
        },
        {
          path: 'development',
          name: 'settings-development-page',
          component: require('@/components/Settings/Development.vue').default
        },
        {
          path: 'about',
          name: 'settings-about-page',
          component: require('@/components/Settings/About.vue').default
        }
      ]
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})

export default router
