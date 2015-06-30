package de.hpi.sec4things.flickerer.transmission;

import java.util.HashSet;
import java.util.Set;
import java.util.Timer;
import java.util.TimerTask;

public class Transmitter {
    private final static int BIT_LENGTH = 60;   // ms
    private final static int START_DELAY = 60;   // ms
    private final static int INIT_DUR = 10;     // s
    private final static String START_PATTERN = "01101011";


    private Set<Timer> timers;
    private Emitter emitter;


    public Transmitter(final Emitter emitter) {
        this.emitter = emitter;
        timers = new HashSet<>(3);
    }

    public void transmit(final String data) {
        // TODO: encode data
        // TODO: assure there is no old timer running

        // toggle zero and one pretty fast
        initialize();
    }

    public void initialized() {
        emitter.emitBit(true);
        System.out.println("Initialized!");
    }

    private void initialize() {
        // create timer for toggling output
        final Timer initTimer = new Timer();
        initTimer.scheduleAtFixedRate(new TimerTask() {
            boolean current_bit = false;
            @Override
            public void run() {
                emitter.emitBit(current_bit);
                current_bit = !current_bit;
            }
        }, START_DELAY, BIT_LENGTH);
        timers.add(initTimer);

        // create timer for stopping the initialization
        final Timer initStopTimer = new Timer();
        initStopTimer.schedule(new TimerTask() {
            @Override
            public void run() {
                initTimer.cancel();
                timers.remove(initTimer);
                timers.remove(initStopTimer);
                initialized();
            }
        }, INIT_DUR * 1000);
        timers.add(initStopTimer);
    }

    public void stop() {
        for (Timer timer: timers) {
            timer.cancel();
        }
        timers.clear();
    }
}
