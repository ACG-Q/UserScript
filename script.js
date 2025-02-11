document.addEventListener('DOMContentLoaded', () => {
    const searchBox = document.getElementById('searchBox');
    const scriptRows = document.querySelectorAll('.script-row');
  
    searchBox.addEventListener('input', () => {
      const searchTerm = searchBox.value.trim().toLowerCase();
  
      scriptRows.forEach((row) => {
        const scriptName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const scriptDescription = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const scriptAuthor = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
  
        if (
          scriptName.includes(searchTerm) ||
          scriptDescription.includes(searchTerm) ||
          scriptAuthor.includes(searchTerm)
        ) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });