package de.hpi.sec4things.flickerer.transmission;

import java.util.Timer;
import java.util.TimerTask;

public class Transmitter extends TimerTask {
    private final static int BIT_LENGTH = 60;   // ms
    private final static int START_DELAY = 60;   // ms
    private final static int INIT_DUR = 10;     // s
    private final static String START_PATTERN = "01101011";
    private Timer timer;

    private Emitter emitter;
    private boolean current_bit = false;


    public Transmitter(final Emitter emitter) {
        this.emitter = emitter;

    }

    public void transmit(final String data) {
        // TODO: encode data
        // TODO: assure there is no old timer running
        timer = new Timer();
        timer.scheduleAtFixedRate(this, START_DELAY, BIT_LENGTH);
    }

    public void stop() {
        timer.cancel();
    }

    @Override
    public void run() {
        // TODO: transmit real data
        emitter.emitBit(current_bit);
        current_bit = !current_bit;
    }
}

