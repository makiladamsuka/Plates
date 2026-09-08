/**
 * Camera Scanner & BarcodeDetector abstraction for Plates QR codes.
 */

export interface ParsedFriendQr {
  friendId: string;
  username?: string;
  name?: string;
  raw: string;
}

export function parseFriendQrPayload(text: string): ParsedFriendQr | null {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();

  // Pattern 1: plates://friend?id=... or plates://invite?id=...
  if (trimmed.startsWith('plates://')) {
    try {
      const url = new URL(trimmed.replace('plates://', 'http://placeholder/'));
      const friendId = url.searchParams.get('id') || url.searchParams.get('friendId');
      if (friendId) {
        return {
          friendId,
          username: url.searchParams.get('username') || undefined,
          name: url.searchParams.get('name') || undefined,
          raw: trimmed,
        };
      }
    } catch {}
  }

  // Pattern 2: Web URL e.g. https://plates.live/invite?friendId=... or http://localhost:5173/invite?...
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const friendId = url.searchParams.get('friendId') || url.searchParams.get('id');
      if (friendId) {
        return {
          friendId,
          username: url.searchParams.get('username') || undefined,
          name: url.searchParams.get('name') || undefined,
          raw: trimmed,
        };
      }
    } catch {}
  }

  // Pattern 3: JSON format {"type":"plates-friend","id":"...","username":"..."}
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.id || parsed.friendId) {
        return {
          friendId: parsed.id || parsed.friendId,
          username: parsed.username || undefined,
          name: parsed.name || undefined,
          raw: trimmed,
        };
      }
    } catch {}
  }

  // Pattern 4: Direct UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(trimmed)) {
    return {
      friendId: trimmed,
      raw: trimmed,
    };
  }

  return null;
}

export function isBarcodeDetectorSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

export class QrScannerManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private animationFrameId: number | null = null;
  private isScanning = false;
  private detector: any = null;
  private onDetectedCallback: ((payload: ParsedFriendQr) => void) | null = null;
  private facingMode: 'environment' | 'user' = 'environment';

  constructor(onDetected: (payload: ParsedFriendQr) => void) {
    this.onDetectedCallback = onDetected;
    if (isBarcodeDetectorSupported()) {
      try {
        const BD = (window as any).BarcodeDetector;
        this.detector = new BD({ formats: ['qr_code'] });
      } catch (e) {
        console.warn('BarcodeDetector instantiation notice:', e);
      }
    }
  }

  public async start(videoEl: HTMLVideoElement, facingMode: 'environment' | 'user' = 'environment'): Promise<void> {
    this.stop();
    this.videoElement = videoEl;
    this.facingMode = facingMode;

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.srcObject = this.stream;
      await videoEl.play();
      this.isScanning = true;
      this.scanLoop();
    } catch (err: any) {
      console.error('Camera access failed:', err);
      throw err;
    }
  }

  public toggleCamera(): Promise<void> {
    const nextMode = this.facingMode === 'environment' ? 'user' : 'environment';
    if (!this.videoElement) return Promise.resolve();
    return this.start(this.videoElement, nextMode);
  }

  public stop(): void {
    this.isScanning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  private async scanLoop(): Promise<void> {
    if (!this.isScanning || !this.videoElement) return;

    if (this.videoElement.readyState >= 2 && this.detector) {
      try {
        const barcodes = await this.detector.detect(this.videoElement);
        if (barcodes && barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          const parsed = parseFriendQrPayload(rawValue);
          if (parsed) {
            // Haptic vibration feedback if supported
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate(40);
              } catch {}
            }
            this.onDetectedCallback?.(parsed);
            return;
          }
        }
      } catch {
        // Ignored frame scan error
      }
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(() => this.scanLoop());
  }

  public async scanFile(file: File): Promise<ParsedFriendQr | null> {
    if (!this.detector) {
      throw new Error('BarcodeDetector is not supported on this browser.');
    }

    const bitmap = await createImageBitmap(file);
    const barcodes = await this.detector.detect(bitmap);
    if (barcodes && barcodes.length > 0) {
      const parsed = parseFriendQrPayload(barcodes[0].rawValue);
      return parsed;
    }
    return null;
  }
}
