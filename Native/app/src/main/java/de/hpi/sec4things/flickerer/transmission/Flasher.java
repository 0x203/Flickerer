package de.hpi.sec4things.flickerer.transmission;

import android.hardware.Camera;

public class Flasher implements Emitter{

    private final Camera camera;
    private final Camera.Parameters p;
    private boolean isOn;

    public Flasher() {
        camera = Camera.open();
        p = camera.getParameters();
        isOn = false;
    }
    
    private void turnOn() {
        p.setFlashMode(Camera.Parameters.FLASH_MODE_TORCH);
        camera.setParameters(p);
        camera.startPreview();
    }

    private void turnOff() {
        p.setFlashMode(Camera.Parameters.FLASH_MODE_OFF);
        camera.setParameters(p);
        camera.stopPreview();
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
