/**
 * Main Application Bootstrap
 */
import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';

import { initTopBar } from './ui/topBarView.js';
import { initDashboard } from './ui/dashboardView.js';
import { initForm } from './ui/formView.js';
import { initFilters } from './ui/filterView.js';
import { initTableView } from './ui/tableView.js';

document.addEventListener('DOMContentLoaded', () => {
  initTopBar();
  initDashboard();
  initForm();
  initFilters();
  initTableView();
});
