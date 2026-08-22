/**
 * Filter and Sorting Toolbar View.
 */
import { store } from '../state/store.js';

export function initFilters() {
  const metalChips = document.querySelectorAll('[data-filter-metal]');
  const categoryChips = document.querySelectorAll('[data-filter-category]');
  const sortSelect = document.getElementById('sort-select');

  metalChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      metalChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const metal = chip.getAttribute('data-filter-metal');
      store.setFilters({ metal });
    });
  });

  categoryChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      categoryChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const category = chip.getAttribute('data-filter-category');
      store.setFilters({ category });
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      store.setSort(e.target.value);
    });
  }
}
