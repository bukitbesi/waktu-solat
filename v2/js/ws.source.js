document.addEventListener('DOMContentLoaded', function () {
  const monthlyContainer = document.getElementById('ws-monthly-content');
  const pdfBtn   = document.getElementById('ws-monthly-pdf-btn');
  const printBtn = document.getElementById('ws-monthly-print-btn');
  const shareBtn = document.getElementById('ws-monthly-share-btn');

  if (pdfBtn && monthlyContainer) {
    pdfBtn.addEventListener('click', function () {
      const w = window.open('', '_blank');
      if (!w) {
        alert('Sila benarkan popup untuk muat turun PDF.');
        return;
      }
      w.document.write('<html><head><title>Jadual Waktu Solat Bulanan</title>');
      w.document.write('<meta name="viewport" content="width=device-width,initial-scale=1">');
      w.document.write('<style>');
      w.document.write('body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;padding:16px;}');
      w.document.write('table{width:100%;border-collapse:collapse;margin-top:12px;}');
      w.document.write('th,td{border:1px solid #ccc;padding:4px 6px;text-align:center;}');
      w.document.write('th{background:#e8f5ed;}');
      w.document.write('</style></head><body>');
      w.document.write('<h2 style="text-align:center;margin:0 0 8px;">Jadual Waktu Solat Bulanan</h2>');
      w.document.write(monthlyContainer.innerHTML);
      w.document.write('</body></html>');
      w.document.close();
      w.focus();
      // user boleh pilih "Save as PDF"
      w.print();
    });
  }

  if (printBtn && monthlyContainer) {
    printBtn.addEventListener('click', function () {
      const htmlAsal = document.body.innerHTML;
      const printHtml = `
        <h2 style="text-align:center;margin:0 0 8px;">Jadual Waktu Solat Bulanan</h2>
        ${monthlyContainer.innerHTML}
      `;
      document.body.innerHTML = printHtml;
      window.print();
      document.body.innerHTML = htmlAsal;
      location.reload(); // reload untuk pulih event listener
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', async function () {
      const url  = location.href.split('#')[0] + '#tab-monthly';
      const text = 'Jadual Waktu Solat Bulanan (JAKIM) - ' + document.title;
      if (navigator.share) {
        try {
          await navigator.share({ title: document.title, text, url });
        } catch (e) {
          // user cancel = diam je
        }
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert('Pautan jadual bulanan telah disalin.');
      } else {
        prompt('Salin pautan ini:', url);
      }
    });
  }
});
