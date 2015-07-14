package de.hpi.sec4things.flickerer.transmission;

import java.io.UnsupportedEncodingException;
import java.util.Timer;
import java.util.TimerTask;

enum TransmitterState {
    STOPPED, INITIALIZING, STARTING, TRANSMITTING
}

public class Transmitter {
    private final static int BIT_LENGTH = 125;   // ms
    private final static int START_DELAY = 0;   // ms
    private final static int INIT_DUR = 10;     // s
    private final static boolean[] START_PATTERN =
            {false, true, true, false, true, false, true, true}; // "01101011";


    private Timer timer;
    private Timer initTimer;
    private Emitter emitter;
    private TransmitterState state = TransmitterState.STOPPED;
    private boolean currentInitBit = true;
    private int currentIndex;
    private byte[] binaryData;


    public Transmitter(final Emitter emitter) {
        this.emitter = emitter;
    }

    public void transmit(final String data) {
        try {
            binaryData = data.getBytes( "UTF-8"); // or use "US-ASCII"?
        } catch (UnsupportedEncodingException e) {
            // TODO: show error
            return;
        }
        // TODO: assure there is no old timer running
        /*
        // print bytes
        System.out.println(data);
        for (byte b : binaryData) {
            System.out.println(String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0'));
        }
        */

        if (state != TransmitterState.STOPPED) {
            System.out.println("WARNING: Transmitter not yet finished, but new tranimssion started");
        }
        changeState(TransmitterState.INITIALIZING);
        timer = new Timer();
        initTimer = new Timer();

        // call tick with a fixed period
        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                tick();
            }
        }, START_DELAY, BIT_LENGTH);

        // stop initialization phase after timeout
        initTimer.schedule(new TimerTask() {
            @Override
            public void run() {
                initialized();
            }
        }, INIT_DUR * 1000);
    }

    private void tick() {
        switch (state) {
            case STOPPED:
                if(timer != null) {
                    try {
                        timer.cancel();
                    } catch (Exception e) {
                        // already cancled
                        timer = null;
                    }
                }
                break;
            case INITIALIZING:
                emitter.emitBit(currentInitBit);
                currentInitBit = !currentInitBit;
                break;
            case STARTING:
                emitter.emitBit(START_PATTERN[currentIndex++]);
                if (currentIndex == START_PATTERN.length) {
                    changeState(TransmitterState.TRANSMITTING);
                }
                break;
            case TRANSMITTING:
                if (currentIndex == binaryData.length * 8) {
                    changeState(TransmitterState.STOPPED);
                }
                emitter.emitBit(isDataBitSet());
                currentIndex++;
                break;
        }
    }

    private void changeState(TransmitterState newState) {
        if (state != newState) {
            state = newState;
            currentIndex = 0;
            // TODO: notify ui to update itself
        }
    }

    private void initialized() {

        changeState(TransmitterState.STARTING);
    }

    private boolean isDataBitSet() {
        int index = currentIndex / 8;  // Get the index of the array for the byte with this bit
        int bitPosition = 7 - currentIndex % 8;  // Position of this bit in a byte

        return (binaryData[index] >> bitPosition & 1) == 1;
    }

    public void stop() {
        changeState(TransmitterState.STOPPED);
        try {
            timer.cancel();
        } catch (Exception e) {
            ;
        }
        try {
            initTimer.cancel();
        } catch (Exception e) {
            ;
        }
        timer = null;
        initTimer = null;
    }
}
