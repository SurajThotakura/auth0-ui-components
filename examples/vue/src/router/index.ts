import { createAuthGuard } from '@auth0/auth0-vue';
import { createRouter, createWebHistory } from 'vue-router';

import HomePage from '@/views/HomePage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/organization-details',
      name: 'organization-details',
      component: () => import('@/views/OrganizationDetailsPage.vue'),
      beforeEnter: createAuthGuard(),
    },
  ],
});

export { router };
