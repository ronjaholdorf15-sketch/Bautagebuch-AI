import axios from 'axios';

/**
 * Service to handle Nextcloud operations via the server-side bridge.
 * This circumvents CORS issues by proxying through the app server.
 */
export const nextcloudService = {
  /**
   * Upload a file to Nextcloud.
   * @param config The app configuration containing Nextcloud credentials.
   * @param path The target path in Nextcloud (e.g., '/Bautagebuch/ProjectA/report.pdf').
   * @param data The file data as base64 string or ArrayBuffer.
   */
  async uploadFile(config: any, path: string, data: string | ArrayBuffer) {
    if (!config.nextcloudUrl || !config.nextcloudUser || !config.nextcloudPass) {
      throw new Error('Nextcloud-Zugangsdaten nicht konfiguriert.');
    }

    const baseUrl = config.nextcloudUrl.replace(/\/$/, '');
    const fullUrl = `${baseUrl}/remote.php/dav/files/${config.nextcloudUser}${path}`;

    try {
      const response = await axios.post('/api/bridge', {
        url: fullUrl,
        method: 'PUT',
        username: config.nextcloudUser,
        password: config.nextcloudPass,
        data: typeof data === 'string' ? data : this._arrayBufferToBase64(data),
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Upload fehlgeschlagen: ${response.status}`);
      }
      return true;
    } catch (error: any) {
      console.error('Nextcloud upload error:', error);
      throw error;
    }
  },

  /**
   * Create a folder in Nextcloud.
   * @param config The app configuration.
   * @param path The folder path.
   */
  async createFolder(config: any, path: string) {
    const baseUrl = config.nextcloudUrl.replace(/\/$/, '');
    const fullUrl = `${baseUrl}/remote.php/dav/files/${config.nextcloudUser}${path}`;

    try {
      const response = await axios.post('/api/bridge', {
        url: fullUrl,
        method: 'MKCOL',
        username: config.nextcloudUser,
        password: config.nextcloudPass,
      });

      // 201 Created or 405 Method Not Allowed (folder already exists)
      return response.status === 201 || response.status === 405;
    } catch (error: any) {
      console.error('Nextcloud folder creation error:', error);
      return false;
    }
  },

  _arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `data:application/octet-stream;base64,${window.btoa(binary)}`;
  }
};
