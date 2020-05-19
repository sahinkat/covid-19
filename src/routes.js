import React from 'react';
import DefaultLayout from './containers/DefaultLayout';

const Dashboard = React.lazy(() => import('./views/Dashboard'));
const Cases = React.lazy(() => import('./views/Cases'));
const CasesPerTest = React.lazy(() => import('./views/CasesPerTest'));
const Deaths = React.lazy(() => import('./views/Deaths'));
const DeathsPerCase = React.lazy(() => import('./views/DeathsPerCase'));
const LogisticRegression = React.lazy(() => import('./views/LogisticRegression'));


// https://github.com/ReactTraining/react-router/tree/master/packages/react-router-config
const routes = [
  { path: '/', exact: true, name: 'Home', component: DefaultLayout },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/cases', name: 'Cases', component: Cases },
  { path: '/casespertest', name: 'CasesPerTest', component: CasesPerTest },
  { path: '/deaths', name: 'Deaths', component: Deaths },
  { path: '/casespertest', name: 'Dashboard', component: Dashboard },
  { path: '/deathspercase', name: 'DeathsPerCase', component: DeathsPerCase },
  { path: '/logistic', name: 'LogisticRegression', component: LogisticRegression },
];

export default routes;
