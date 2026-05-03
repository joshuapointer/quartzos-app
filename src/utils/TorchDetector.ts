import { Audio } from 'expo-av';

const TORCH_METERING_THRESHOLD = -15;

class TorchDetector {
  private recording: Audio.Recording | null = null;
  private isListening = false;

  async startListening(onDetect: () => void) {
    if (this.isListening) return;

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.warn('[TorchDetector] Microphone permission denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      this.isListening = true;

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.LOW_QUALITY,
        (status) => {
          if (!this.isListening) return;
          // Audio volume is normally between -160 and 0 decibels.
          if (status.metering !== undefined && status.metering > TORCH_METERING_THRESHOLD) {
            console.log('[TorchDetector] Torch detected! Metering:', status.metering);
            this.stopListening();
            onDetect();
          }
        },
        100 // polling interval in milliseconds
      );

      this.recording = recording;
    } catch (err) {
      console.warn('[TorchDetector] Failed to start listening:', err);
      this.isListening = false;
    }
  }

  async stopListening() {
    if (!this.isListening) return;
    this.isListening = false;

    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (err) {
        console.warn('[TorchDetector] Error stopping recording:', err);
      }
      this.recording = null;
    }
  }
}

export const torchDetector = new TorchDetector();
