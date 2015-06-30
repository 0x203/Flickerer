package de.hpi.sec4things.flickerer.transmission;

import java.util.HashSet;
import java.util.Set;
import java.util.Timer;
import java.util.TimerTask;

public class Transmitter {
    private final static int BIT_LENGTH = 60;   // ms
    private final static int START_DELAY = 0;   // ms
    private final static int INIT_DUR = 10;     // s
    private final static boolean[] START_PATTERN =
            {false, true, true, false, true, false, true, true}; // "01101011";


    private Set<Timer> timers;
    private Emitter emitter;


    public Transmitter(final Emitter emitter) {
        this.emitter = emitter;
        timers = new HashSet<>(3);
    }

    public void transmit(final String data) {
        // TODO: encode data
        // TODO: assure there is no old timer running

        // start with the sending process
        initialize();
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
                sendStartPattern();
            }
        }, INIT_DUR * 1000);
        timers.add(initStopTimer);
    }

    public void sendStartPattern() {
        System.out.println("Initialized!");
        final Timer startTimer = new Timer();
        timers.add(startTimer);
        startTimer.scheduleAtFixedRate(new TimerTask() {
            int current_pos = 0;

            @Override
            public void run() {
                emitter.emitBit(START_PATTERN[current_pos++]);
                if (current_pos == START_PATTERN.length) {
                    startTimer.cancel();
                    timers.remove(startTimer);
                    sendData();
                }
            }
        }, START_DELAY, BIT_LENGTH);
        emitter.emitBit(true);
    }

    private void sendData() {
        System.out.println("Can send data now!");
        // TODO: implement me!
    }

    public void stop() {
        for (Timer timer: timers) {
            timer.cancel();
        }
        timers.clear();
    }
}
