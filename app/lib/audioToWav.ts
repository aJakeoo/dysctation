function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export async function blobToWav(blob: Blob): Promise<Blob> {
  console.error("[audioToWav] input blob", { size: blob.size, type: blob.type });

  const arrayBuffer = await blob.arrayBuffer();
  console.error("[audioToWav] arrayBuffer byteLength", arrayBuffer.byteLength);

  const audioContext = new AudioContext();
  try {
    let decoded;
    try {
      decoded = await audioContext.decodeAudioData(arrayBuffer);
    } catch (decodeError) {
      console.error("[audioToWav] decodeAudioData failed", decodeError);
      throw decodeError;
    }
    console.error("[audioToWav] decoded", {
      sampleRate: decoded.sampleRate,
      numberOfChannels: decoded.numberOfChannels,
      length: decoded.length,
      duration: decoded.duration,
    });

    const samples = decoded.getChannelData(0);
    const wav = encodeWav(samples, decoded.sampleRate);
    console.error("[audioToWav] encoded wav blob", { size: wav.size, type: wav.type });
    return wav;
  } catch (err) {
    console.error("[audioToWav] blobToWav failed", err);
    throw err;
  } finally {
    await audioContext.close().catch((closeErr) => {
      console.error("[audioToWav] audioContext.close failed", closeErr);
    });
  }
}
