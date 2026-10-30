import { createRouter, createWebHashHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AdminLayout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '工作台' },
        },
      ],
    },
    {
      path: '/user',
      name: 'User',
      component: () => import('@/views/user/index.vue'),
      meta: { title: '用户管理' },
    },
    {
      path: '/ebook',
      name: 'Ebook',
      component: () => import('@/views/ebook/index.vue'),
      meta: { title: '电子书' },
    },
    {
      path: '/tv',
      name: 'Tv',
      component: () => import('@/views/tv/index.vue'),
      meta: { title: '小电视' },
    },
  ],
})

export default router
