export const sharedStyles = `
<style>
  body {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .tables-container {
    padding: 0;
    margin: 0;
  }

  .table-container {
    width: 100%;
    margin-bottom: 20px;
    page-break-inside: avoid;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    margin-bottom: 20px;
  }

  table:last-child {
    margin-bottom: 0;
  }

  tr {
    page-break-inside: avoid;
  }

  td, th {
    border: 1px solid #000;
    padding: 4px;
    text-align: center;
    vertical-align: middle;
  }

  td p, th p {
    margin: 0;
    padding: 0;
    line-height: 1.2;
  }

  thead {
    display: table-header-group;
  }

  tbody {
    display: table-row-group;
  }

  .header-container {
    margin-bottom: 80px;
  }

  .header {
    text-align: center;
    padding: 4px;
    margin-bottom: 10px;
  }

  .header-description {
    max-width: fit-content;
    margin: 0 auto;
  }

  .header-description h2 {
    font-size: 16px;
    text-align: center;
  }

  .header-description hr {
    margin-top: 10px;
  }

  .header-description p {
    font-size: 12px;
    margin-top: -4px;
    text-align: center;
  }

  .college-logo {
    max-width: 200px;
    margin: 0 auto;
    aspect-ratio: 16/9;
  }

  .college-name {
    font-size: 18px;
    font-weight: bold;
  }

  .university-name {
    font-size: 16px;
  }

  @media print {
    @page {
      margin: 0.5in 0.3in;
    }

    .table-container {
      page-break-inside: avoid !important;
    }

    table {
      page-break-inside: avoid !important;
    }

    tr {
      page-break-inside: avoid !important;
    }

    thead {
      display: table-header-group !important;
    }

    tbody {
      page-break-inside: avoid !important;
    }
  }
</style>
`; 