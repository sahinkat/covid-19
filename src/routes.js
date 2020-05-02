import React from 'react';
import DefaultLayout from './containers/DefaultLayout';

const Dashboard = React.lazy(() => import('./views/Dashboard'));
const Cases = React.lazy(() => import('./views/Cases'));
const Deaths = React.lazy(() => import('./views/Deaths'));


// https://github.com/ReactTraining/react-router/tree/master/packages/react-router-config
const routes = [
  { path: '/', exact: true, name: 'Home', component: DefaultLayout },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/cases', name: 'Cases', component: Cases },
  { path: '/deaths', name: 'Deaths', component: Deaths },
  { path: '/casespertest', name: 'Dashboard', component: Dashboard },
  { path: '/deathpercase', name: 'Dashboard', component: Dashboard },
];

export default routes;
