/**
 * Service to handle CSV generation, template downloading, and parsing.
 */

function triggerFileDownload(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const CsvService = {
  downloadTemplate() {
    const csvContent = 
      'Metal,Category,Grams,BuyRate,Deduction,Date\n' +
      'Gold,Jewelry,10,12000,4,2026-01-01\n' +
      'Silver,Coin/Bar,500,220,0,2026-01-01\n';
    triggerFileDownload(csvContent, 'precious_metals_template.csv');
  },

  exportPortfolio(portfolio) {
    let csvContent = 'Metal,Category,Grams,BuyRate,Deduction,Date\n';
    portfolio.forEach((record) => {
      csvContent += `${record.metal},${record.category},${record.grams},${record.rateBought},${record.deduction || 0},${record.date}\n`;
    });
    const dateStr = new Date().toISOString().split('T')[0];
    triggerFileDownload(csvContent, `metals_portfolio_backup_${dateStr}.csv`);
  },

  /**
   * Reads a File object, parses CSV lines, validates data types and format.
   * @param {File} file
   * @returns {Promise<{added: Array, skippedCount: number}>}
   */
  async parseAndValidateCSV(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => reject(new Error('Failed to read CSV file.'));
      
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split(/\r?\n/);
          const validRecords = [];
          let skippedCount = 0;

          // Start at 1 to skip header
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = line.split(',').map((c) => c.trim());
            if (cols.length >= 6) {
              const metal = cols[0];
              const category = cols[1];
              const grams = parseFloat(cols[2]);
              const rateBought = parseFloat(cols[3]);
              const deduction = parseFloat(cols[4]);
              const date = cols[5];

              const isValid =
                (metal.toLowerCase() === 'gold' || metal.toLowerCase() === 'silver') &&
                !isNaN(grams) && grams > 0 &&
                !isNaN(rateBought) && rateBought > 0 &&
                !isNaN(deduction) && deduction >= 0 &&
                date && !isNaN(new Date(date).getTime());

              if (isValid) {
                validRecords.push({
                  id: Date.now() + i + Math.floor(Math.random() * 1000),
                  metal: metal.charAt(0).toUpperCase() + metal.slice(1).toLowerCase(),
                  category: category || 'Coin/Bar',
                  grams: Number(grams),
                  rateBought: Number(rateBought),
                  deduction: Number(deduction),
                  date: date
                });
              } else {
                skippedCount++;
              }
            } else {
              skippedCount++;
            }
          }

          resolve({ added: validRecords, skippedCount });
        } catch (err) {
          reject(err);
        }
      };

      reader.readAsText(file);
    });
  }
};
