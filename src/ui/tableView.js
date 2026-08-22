/**
 * Table View: Renders the portfolio records list with metrics and actions.
 */
import { store } from '../state/store.js';
import { calculateRecordMetrics } from '../utils/calculations.js';
import { formatINR, formatPercent, formatDate, formatGrams } from '../utils/formatters.js';
import { setupDragAndDropEvents } from './dragAndDrop.js';
import { toast } from './toast.js';

export function initTableView() {
  const tbody = document.getElementById('portfolio-list');
  const tableContainer = document.getElementById('table-wrapper');

  function render() {
    const records = store.getFilteredAndSortedPortfolio();
    const rates = store.getRates();
    const isManualSort = store.sortBy === 'manual' && store.filters.metal === 'ALL' && store.filters.category === 'ALL';

    tbody.innerHTML = '';

    if (records.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            <div class="empty-state-icon">📦</div>
            <div>No matching precious metal assets found.</div>
          </td>
        </tr>
      `;
      return;
    }

    records.forEach((record, index) => {
      const currentRate = record.metal === 'Gold' ? rates.gold : rates.silver;
      const metrics = calculateRecordMetrics(record, currentRate);
      const tagClass = record.metal === 'Gold' ? 'tag-gold' : 'tag-silver';

      const tr = document.createElement('tr');
      if (isManualSort) {
        tr.className = 'draggable';
        tr.setAttribute('draggable', 'true');
        setupDragAndDropEvents(tr, index);
      }

      const returnColorClass = metrics.isProfitable ? 'text-success' : 'text-danger';

      tr.innerHTML = `
        <td>
          <div class="cell-asset">
            ${isManualSort ? '<span class="drag-handle" title="Drag to reorder">⋮⋮</span>' : ''}
            <div class="cell-asset-info">
              <div class="cell-asset-title">
                <span class="tag ${tagClass}">${record.metal}</span>
                <span>${record.category}</span>
              </div>
              <span class="cell-asset-date">${formatDate(record.date)}</span>
            </div>
          </div>
        </td>
        <td><strong>${formatGrams(record.grams)}</strong></td>
        <td>${formatINR(metrics.invested)}</td>
        <td>${record.deduction || 0}%</td>
        <td class="text-warning" style="font-weight: 700;">${formatINR(metrics.liquidValue)}</td>
        <td style="text-align: center;">
          <div class="${returnColorClass}" style="font-weight: 700; font-size: 0.95rem;">
            ${formatPercent(metrics.totalReturnPct)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 2px;">
            ${metrics.cagrDisplay}
          </div>
        </td>
        <td class="action-btns">
          <button class="btn btn-sm btn-edit" data-id="${record.id}" title="Edit purchase">✏️ Edit</button>
          <button class="btn btn-sm btn-danger btn-delete" data-id="${record.id}" title="Delete record">🗑️</button>
        </td>
      `;

      // Wire edit button
      tr.querySelector('.btn-edit').addEventListener('click', () => {
        store.setEditingId(record.id);
      });

      // Wire delete button
      tr.querySelector('.btn-delete').addEventListener('click', () => {
        const confirmDelete = window.confirm(`Remove this ${record.metal} (${record.grams}g) purchase?`);
        if (confirmDelete) {
          store.deleteRecord(record.id);
          toast.info('Purchase removed from portfolio.');
        }
      });

      tbody.appendChild(tr);
    });
  }

  store.subscribe(render);
  render();
}
