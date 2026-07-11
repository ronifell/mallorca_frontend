import { Audio } from 'expo-av';
import { Platform } from 'react-native';

/**
 * Lightweight wrapper around expo-av's Audio.Recording so the chat input can
 * start/stop a voice memo without dragging audio-mode setup logic into the
 * UI layer.
 *
 * The recorder produces a small m4a (AAC) file on iOS / Android and exposes
 * the resulting URI plus an approximate duration in seconds. Callers can
 * upload that URI directly through the multipart `chatApi.uploadAudio` helper.
 */
export interface RecordingResult {
  uri: string;
  durationSeconds: number;
  mimeType: string;
}

const RECORDING_OPTIONS: Audio.RecordingOptions =
  Audio.RecordingOptionsPresets.HIGH_QUALITY;

let activeRecording: Audio.Recording | null = null;

/**
 * Asks the OS for microphone permission (no-op if already granted).
 * Returns `true` when the caller can proceed to start a recording.
 */
export async function ensureMicPermission(): Promise<boolean> {
  const status = await Audio.getPermissionsAsync();
  if (status.granted) return true;
  if (!status.canAskAgain) return false;
  const req = await Audio.requestPermissionsAsync();
  return req.granted;
}

/**
 * Begin recording. Throws if permission is missing or another recording is
 * already in progress. Configures the audio session so iOS allows recording
 * even when the device is in silent mode.
 */
export async function startVoiceRecording(): Promise<void> {
  if (activeRecording) {
    throw new Error('Ya hay una grabación en curso.');
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(RECORDING_OPTIONS);
  await recording.startAsync();
  activeRecording = recording;
}

/**
 * Stop the in-progress recording and return the local file URI plus its
 * approximate duration. Releases the recorder and restores the default audio
 * mode so background playback (e.g. spotify) resumes.
 */
export async function stopVoiceRecording(): Promise<RecordingResult | null> {
  const recording = activeRecording;
  if (!recording) return null;
  activeRecording = null;

  try {
    await recording.stopAndUnloadAsync();
  } catch {
    // Recorder was never actually started — nothing to clean up.
  }

  const uri = recording.getURI();
  const status = await recording.getStatusAsync().catch(() => null);
  const durationMs = status && 'durationMillis' in status ? status.durationMillis ?? 0 : 0;

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });

  if (!uri) return null;
  return {
    uri,
    durationSeconds: Math.round(durationMs / 100) / 10,
    mimeType: Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a',
  };
}

/** Aborts the current recording without producing a file. Safe to call repeatedly. */
export async function cancelVoiceRecording(): Promise<void> {
  const recording = activeRecording;
  if (!recording) return;
  activeRecording = null;
  try {
    await recording.stopAndUnloadAsync();
  } catch {
    /* ignore */
  }
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  }).catch(() => undefined);
}
