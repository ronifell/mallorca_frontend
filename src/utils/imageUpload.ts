import * as FileSystem from 'expo-file-system';
import { ImagePickerAsset } from 'expo-image-picker';
import { InteractionManager, Platform } from 'react-native';
import { LocalizedError } from './localizedError';

export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

function extForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

/** Build a multipart file descriptor from an image-picker asset. */
export function buildUploadFile(asset: ImagePickerAsset): UploadFile {
  const name = asset.fileName ?? `photo-${Date.now()}.jpg`;
  const ext = name.split('.').pop()?.toLowerCase();
  const type =
    asset.mimeType ??
    (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');

  return {
    uri: asset.uri,
    name,
    type,
  };
}

function formUri(uri: string): string {
  // iOS multipart uploads expect a path without the file:// scheme.
  if (Platform.OS === 'ios') return uri.replace(/^file:\/\//, '');
  // Android RN fetch/FormData expects a file:// URI for cached copies.
  if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  return `file://${uri}`;
}

async function assertCachedFile(uri: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(uri, { size: true });
  if (!info.exists) {
    throw new LocalizedError('errors.uploadFailed');
  }
  const size = 'size' in info ? info.size ?? 0 : 0;
  if (size <= 0) {
    throw new LocalizedError('errors.uploadFailed');
  }
}

/**
 * Materialise a picked image into app cache as file:// so multipart upload
 * works reliably on Android 12+ DocumentsUI content:// URIs.
 */
async function materializeToCache(sourceUri: string, cacheUri: string): Promise<void> {
  if (sourceUri.startsWith('file://')) {
    await FileSystem.copyAsync({ from: sourceUri, to: cacheUri });
    await assertCachedFile(cacheUri);
    return;
  }

  if (Platform.OS === 'android' && sourceUri.startsWith('content://')) {
    try {
      await FileSystem.copyAsync({ from: sourceUri, to: cacheUri });
      await assertCachedFile(cacheUri);
      return;
    } catch {
      // DocumentsUI content:// URIs on API 31 often reject copyAsync.
    }

    try {
      const base64 = await FileSystem.readAsStringAsync(sourceUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (!base64) throw new Error('empty base64 read');
      await FileSystem.writeAsStringAsync(cacheUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await assertCachedFile(cacheUri);
      return;
    } catch {
      // Last resort: stream via fetch (works on some OEM content resolvers).
      const response = await fetch(sourceUri);
      if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onerror = () => reject(reader.error ?? new Error('read failed'));
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result !== 'string') {
            reject(new Error('unexpected reader result'));
            return;
          }
          const comma = result.indexOf(',');
          resolve(comma >= 0 ? result.slice(comma + 1) : result);
        };
        reader.readAsDataURL(blob);
      });
      await FileSystem.writeAsStringAsync(cacheUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await assertCachedFile(cacheUri);
      return;
    }
  }

  await FileSystem.copyAsync({ from: sourceUri, to: cacheUri });
  await assertCachedFile(cacheUri);
}

/**
 * Copy the picked image into app cache so uploads use a stable file:// URI.
 * Android content:// URIs (especially from DocumentsUI on API 31+) often
 * fail multipart reads unless materialised into cache first.
 */
export async function prepareUploadFile(asset: ImagePickerAsset): Promise<UploadFile> {
  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve());
  });

  const file = buildUploadFile(asset);
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    return {
      uri: formUri(file.uri),
      name: file.name,
      type: file.type,
    };
  }

  const cacheUri = `${cacheDir}upload-${Date.now()}.${extForMime(file.type)}`;

  try {
    await materializeToCache(asset.uri, cacheUri);
  } catch {
    throw new LocalizedError('errors.uploadFailed');
  }

  return {
    uri: formUri(cacheUri),
    name: file.name,
    type: file.type,
  };
}
