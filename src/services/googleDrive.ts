export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
}

export interface DriveStorageInfo {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
  user?: {
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  };
}

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

/**
 * List files and folders from Google Drive
 */
export async function listDriveFiles(
  accessToken: string,
  folderId?: string,
  search?: string,
  categoryFilter?: string
): Promise<DriveFileItem[]> {
  const queryParts = ["trashed = false"];

  if (folderId) {
    queryParts.push(`'${folderId}' in parents`);
  }

  if (search && search.trim()) {
    queryParts.push(`name contains '${search.replace(/'/g, "\\'")}'`);
  }

  if (categoryFilter) {
    if (categoryFilter === 'folders') {
      queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
    } else if (categoryFilter === 'documents') {
      queryParts.push("(mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/pdf' or mimeType contains 'word')");
    } else if (categoryFilter === 'spreadsheets') {
      queryParts.push("(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType contains 'sheet' or mimeType contains 'excel')");
    } else if (categoryFilter === 'presentations') {
      queryParts.push("(mimeType = 'application/vnd.google-apps.presentation' or mimeType contains 'presentation' or mimeType contains 'powerpoint')");
    }
  }

  const q = encodeURIComponent(queryParts.join(' and '));
  const fields = encodeURIComponent('files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,iconLink,thumbnailLink,parents)');
  const url = `${DRIVE_API_URL}/files?q=${q}&fields=${fields}&orderBy=folder,modifiedTime desc&pageSize=100`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal membaca Google Drive (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Create a new folder in Google Drive
 */
export async function createDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<DriveFileItem> {
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const response = await fetch(`${DRIVE_API_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Gagal membuat folder di Google Drive');
  }

  return response.json();
}

/**
 * Upload a file directly to Google Drive (Multipart upload)
 */
export async function uploadFileToDrive(
  accessToken: string,
  file: File,
  description?: string,
  parentFolderId?: string
): Promise<DriveFileItem> {
  const metadata: any = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    description: description || 'Dokumen SIAKAD SMA Negeri 14 Kota Tidore Kepulauan'
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileContentBase64 = await new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${file.type || 'application/octet-stream'}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    fileContentBase64 +
    closeDelimiter;

  const response = await fetch(DRIVE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Gagal mengunggah berkas ke Google Drive');
  }

  return response.json();
}

/**
 * Delete a file or folder from Google Drive
 */
export async function deleteDriveFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  const response = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Gagal menghapus berkas dari Google Drive');
  }
}

/**
 * Get Google Drive storage and user quota
 */
export async function getDriveStorageInfo(accessToken: string): Promise<DriveStorageInfo> {
  const url = `${DRIVE_API_URL}/about?fields=storageQuota,user(displayName,emailAddress,photoLink)`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    return {};
  }

  const data = await response.json();
  return {
    limit: data.storageQuota?.limit,
    usage: data.storageQuota?.usage,
    usageInDrive: data.storageQuota?.usageInDrive,
    usageInDriveTrash: data.storageQuota?.usageInDriveTrash,
    user: data.user
  };
}
