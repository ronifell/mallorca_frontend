import * as FileSystem from 'expo-file-system';
import { ImagePickerAsset } from 'expo-image-picker';
import { InteractionManager, Platform } from 'react-native';

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
  return Platform.OS === 'ios' ? uri.replace(/^file:\/\//, '') : uri;
}

/**
 * Copy the picked image into app cache so uploads use a stable file:// URI.
 * Android content:// URIs (especially after allowsEditing) often fail on the
 * first multipart read but succeed on a second attempt — copying avoids that.
 */
export async function prepareUploadFile(asset: ImagePickerAsset): Promise<UploadFile> {
  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve());
  });

  const file = buildUploadFile(asset);
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) return file;

  const cacheUri = `${cacheDir}upload-${Date.now()}.${extForMime(file.type)}`;
  await FileSystem.copyAsync({ from: asset.uri, to: cacheUri });

  return {
    uri: formUri(cacheUri),
    name: file.name,
    type: file.type,
  };
}
