/** Browser parity for Expo print: use the system print dialog.
 * Users can select Save as PDF in Chromium/Firefox/Safari.
 */
export const printClient = {
  async printAsync({ html }: { html: string }): Promise<void> {
    const frame = document.createElement("iframe");
    frame.setAttribute("title", "Global Stock print preview");
    frame.style.cssText = "position:absolute;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(frame);
    try {
      if (!frame.contentWindow) throw new Error("No se pudo abrir la impresión.");
      frame.contentWindow.document.open();
      frame.contentWindow.document.write(html);
      frame.contentWindow.document.close();
      await new Promise<void>(resolve => setTimeout(resolve, 280));
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } finally { setTimeout(() => frame.remove(), 1800); }
  },
  async printToFileAsync({ html }: { html: string }): Promise<{uri:string}> {
    return { uri: URL.createObjectURL(new Blob([html], {type:"text/html"})) };
  }
};
