export {};

declare global {
  interface Window {
    electronAPI: {
      listPdfs: (folderPath: string, signatureDir: string) => Promise<any[]>;
      readPdf: (filePath: string) => Promise<string>;
      deletePdf: (filePath: string) => Promise<void>;
      saveSignature: (signatureDir: string, stem: string, base64Data: string) => Promise<void>;
      deleteSignature: (signatureDir: string, stem: string) => Promise<void>;
      onConfigUpdated: (callback: (newConfig: any) => void) => void;
      config: any;
    };
  }
}
