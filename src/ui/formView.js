/**
 * Form View: Handles adding and editing precious metals purchases.
 */
import { store } from '../state/store.js';
import { toast } from './toast.js';

export function initForm() {
  const form = document.getElementById('metal-form');
  const titleEl = document.getElementById('form-title');
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const editIdInput = document.getElementById('edit-id');

  const metalInput = document.getElementById('metal-type');
  const categoryInput = document.getElementById('item-category');
  const gramsInput = document.getElementById('item-grams');
  const rateInput = document.getElementById('item-rate-bought');
  const deductionInput = document.getElementById('item-deduction');
  const dateInput = document.getElementById('item-date');

  function resetForm() {
    form.reset();
    editIdInput.value = '';
    titleEl.innerText = 'Add Purchase';
    submitBtn.innerHTML = '✨ Save to Portfolio';
    cancelBtn.style.display = 'none';
    dateInput.value = new Date().toISOString().split('T')[0];
    deductionInput.value = categoryInput.value === 'Jewelry' ? '4' : '0';
    store.setEditingId(null);
  }

  // Set default initial date
  dateInput.value = new Date().toISOString().split('T')[0];

  // Auto-suggest deduction based on category
  categoryInput.addEventListener('change', () => {
    if (!editIdInput.value) {
      deductionInput.value = categoryInput.value === 'Jewelry' ? '4' : '0';
    }
  });

  // Handle Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const recordData = {
      metal: metalInput.value,
      category: categoryInput.value,
      grams: parseFloat(gramsInput.value),
      rateBought: parseFloat(rateInput.value),
      deduction: parseFloat(deductionInput.value) || 0,
      date: dateInput.value
    };

    if (isNaN(recordData.grams) || recordData.grams <= 0) {
      toast.error('Please enter a valid weight in grams.');
      return;
    }
    if (isNaN(recordData.rateBought) || recordData.rateBought <= 0) {
      toast.error('Please enter a valid purchase rate.');
      return;
    }

    const editId = editIdInput.value ? parseInt(editIdInput.value, 10) : null;

    if (editId) {
      store.updateRecord(editId, recordData);
      toast.success('Purchase updated successfully.');
      resetForm();
    } else {
      store.addRecord(recordData);
      toast.success(`Added ${recordData.grams}g ${recordData.metal} to portfolio.`);
      resetForm();
    }
  });

  cancelBtn.addEventListener('click', () => {
    resetForm();
    toast.info('Edit cancelled.');
  });

  // Watch store for editing triggers
  store.subscribe((state) => {
    const editRecord = state.getEditingRecord();
    if (editRecord) {
      titleEl.innerText = 'Edit Purchase';
      submitBtn.innerHTML = '💾 Update Record';
      cancelBtn.style.display = 'block';

      editIdInput.value = editRecord.id;
      metalInput.value = editRecord.metal;
      categoryInput.value = editRecord.category;
      gramsInput.value = editRecord.grams;
      rateInput.value = editRecord.rateBought;
      deductionInput.value = editRecord.deduction ?? 0;
      dateInput.value = editRecord.date;

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}
