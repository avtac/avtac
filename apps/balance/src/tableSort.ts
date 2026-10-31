
function sortOnColumn(table: HTMLTableElement, index: number) {
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.querySelectorAll("tr")) as Element[];
  rows.sort((a: Element, b: Element) => {
    const aColumn = a.querySelectorAll("td")[index];
    const bColumn = b.querySelectorAll("td")[index];
    if (aColumn.firstChild instanceof HTMLInputElement && bColumn.firstChild instanceof HTMLInputElement) {
      if (aColumn.firstChild.type === 'number' && bColumn.firstChild.type === 'number')
        return Number(aColumn.firstChild.value) - Number(bColumn.firstChild.value);
      else if (aColumn.firstChild.type === 'checkbox' && bColumn.firstChild.type === 'checkbox')
        return (aColumn.firstChild.checked ? -1 : 1) - (bColumn.firstChild.checked ? -1 : 1);
      else
        return aColumn.firstChild.value.localeCompare(bColumn.firstChild.value);
    }
    else if (!isNaN(Number(aColumn.textContent)) && !isNaN(Number(bColumn.textContent))) {
      return Number(aColumn.textContent) - Number(bColumn.textContent);
    }
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    return collator.compare(aColumn.textContent, bColumn.textContent);
  })

  const thead = table.tHead;
  if (!thead) return;
  const columns = Array.from(thead.querySelectorAll("th")) as Element[];
  columns.forEach((c, i) => { if (i != index) c.classList.remove("forward") });
  columns.forEach((c, i) => { if (i != index) c.classList.remove("reverse") });
  columns.forEach(c => c.classList.remove("sorted"));
  if (columns[index].classList.contains("forward")) {
    columns[index].classList.remove("forward");
    columns[index].classList.add("reverse");
    rows.reverse();
  } else {
    columns[index].classList.remove("reverse");
    columns[index].classList.add("forward");
  }
  columns[index].classList.add("sorted");
  tbody.replaceChildren(...rows);
}

function modifyHeader(table: HTMLTableElement) {
  const header = table.querySelector('thead tr');
  if (!header) return;
  const columns = header.querySelectorAll("th");
  columns.forEach((column, index) => {
    if (column.classList.contains("noSort")) return;
    column.classList.add("sortable");
    column.onclick = () => sortOnColumn(table, index)
    if (column.classList.contains("defaultForward")) column.click();
    if (column.classList.contains("defaultBackward")) { column.click(); column.click() };
  });
}

export function tableSort() {
  const sortedTables = document.querySelectorAll(".sortedTable");
  for (const table of sortedTables) {
    modifyHeader(table as HTMLTableElement);
  }
}
