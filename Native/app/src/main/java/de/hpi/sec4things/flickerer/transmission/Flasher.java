package de.hpi.sec4things.flickerer.transmission;

import android.graphics.SurfaceTexture;
import android.hardware.Camera;

import java.io.IOException;

public class Flasher implements Emitter{

    private static Camera camera;
    private final Camera.Parameters pOn, pOff;
    private boolean isOn;

    public Flasher() {
        camera = Camera.open();

        pOn = camera.getParameters();
        pOn.setFlashMode(Camera.Parameters.FLASH_MODE_TORCH);
        pOff = camera.getParameters();
        pOff.setFlashMode(Camera.Parameters.FLASH_MODE_OFF);

        // Nexus 5 needs previewTexture
        try {
            camera.setPreviewTexture(new SurfaceTexture(0));
        } catch (IOException e) {
            e.printStackTrace();
        }

        camera.startPreview();
        isOn = false;
    }
    
    private void turnOn() {
        camera.setParameters(pOn);
        isOn = true;
    }

    private void turnOff() {
        camera.setParameters(pOff);
        isOn = false;
    }

    @Override
    public void emitBit(boolean bit) {
        if (bit & !isOn) {
            turnOn();
        } else if (isOn & !bit) {
            turnOff();
        }
    }
}
