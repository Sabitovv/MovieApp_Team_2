export async function loadComponent(folderPath, name){
  const htmlPath = `${folderPath}/${name}.html`;
  const cssPath = `${folderPath}/${name}.css`;

  try {
    const headRes = await fetch(cssPath, { method: "HEAD" });
    if (headRes.ok && !document.querySelector(`link[data-component="${cssPath}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssPath;
      link.setAttribute("data-component", cssPath);
      document.head.appendChild(link);
    }
  } catch(e){
  }

  const res = await fetch(htmlPath);
  if (!res.ok) return `<div style="color:salmon">Ошибка загрузки ${name}</div>`;
  return await res.text();
}