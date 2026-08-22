/**
 * Drag and drop handlers for table row reordering.
 */
import { store } from '../state/store.js';

let dragStartIndex = null;

export function setupDragAndDropEvents(row, index) {
  row.addEventListener('dragstart', (e) => {
    dragStartIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    row.style.opacity = '0.4';
  });

  row.addEventListener('dragover', (e) => {
    e.preventDefault();
    row.classList.add('drag-over');
  });

  row.addEventListener('dragleave', () => {
    row.classList.remove('drag-over');
  });

  row.addEventListener('drop', (e) => {
    e.preventDefault();
    row.classList.remove('drag-over');
    const dragEndIndex = index;
    if (dragStartIndex !== null && dragStartIndex !== dragEndIndex) {
      store.reorder(dragStartIndex, dragEndIndex);
    }
  });

  row.addEventListener('dragend', () => {
    row.style.opacity = '1';
    document.querySelectorAll('.draggable').forEach((r) => r.classList.remove('drag-over'));
  });
}
