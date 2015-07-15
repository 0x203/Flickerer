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
    private final static boolean[] START_PATTERN_HAMMING =
            {true, false, false, true, false, true, false, false}; // "10010100";


    private Timer timer;
    private Timer initTimer;
    private final Emitter emitter;
    private final boolean encodeWithHamming;

    private TransmitterState state = TransmitterState.STOPPED;
    private boolean currentInitBit = true;
    private int currentIndex;
    private byte[] binaryData;
    private boolean[] startPattern = START_PATTERN;


    public Transmitter(final Emitter emitter, final boolean encodeWithHamming) {
        this.emitter = emitter;
        this.encodeWithHamming = encodeWithHamming;
    }

    public void transmit(final String data) {
        try {
            binaryData = data.getBytes( "UTF-8"); // or use "US-ASCII"?
        } catch (UnsupportedEncodingException e) {
            // TODO: show error
            return;
        }

        for (byte b : binaryData) {
            System.out.println(String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0'));
        }
        if(encodeWithHamming) {
            binaryData = HammingEncoder.encode(binaryData);
            startPattern = START_PATTERN_HAMMING;
        }
        System.out.println("Again with Hamming");
        for (byte b : binaryData) {
            System.out.println(String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0'));
        }

        // TODO: assure there is no old timer running
        /*
        // print bytes
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
                emitter.emitBit(startPattern[currentIndex++]);
                if (currentIndex == startPattern.length) {
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

class HammingEncoder {
    private static char[] G = {
            0b1101,
            0b1011,
            0b1000,
            0b0111,
            0b0100,
            0b0010,
            0b0001};

    public static byte[] encode(byte[] input) {
        byte[] output = new byte[input.length * 2];
        for (int i = 0; i < input.length; i++) {
            output[i] = encodeHalfByte((char) (input[i] >> 4));
            output[i + 1] = encodeHalfByte((char) (input[i] & 0x0F));
        }
        return output;
    }

    private static byte encodeHalfByte(char c) {
        char result = 0;
        char bitmask = 1 << 7;
        for (int i = 0; i < G.length; i++) {
            if (hasOddParity(G[i] & c)) {
                result = (char) (result | bitmask);
            }
            bitmask = (char) (bitmask >> 1);
        }
        if (hasOddParity(result)) {
            result = (char) (result | 1);
        }

        return (byte) result;
    }

    private static boolean hasOddParity(final int bb) {
        // http://www.mindprod.com/jgloss/parity.html
        int parity = bb ^ ( bb >> 4 );
        parity ^= parity >> 2;
        parity ^= parity >> 1;
        return ( parity & 1 ) != 0;
    }
}

