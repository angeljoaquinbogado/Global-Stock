/** Browser sharing opens the same print preview for Save as PDF.
 * A generated HTML blob must never be falsely described as a PDF.
 */
export const shareClient = {
  async isAvailableAsync() { return typeof window !== "undefined"; },
  async shareAsync(uri: string): Promise<void> {
    const tab=window.open(uri,"_blank","noopener,noreferrer");
    if (!tab) throw new Error("Habilitá las ventanas emergentes para abrir el documento.");
  }
};
