package de.hpi.sec4things.flickerer.transmission;

import android.widget.TextView;

import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.zip.CRC32;

import de.hpi.sec4things.flickerer.R;

enum TransmitterState {
    STOPPED, INITIALIZING, STARTING, TRANSMITTING
}

public class Transmitter {
    private final static int BIT_LENGTH_MULTIPLIER = 1000000; // nano
    private static long BIT_LENGTH = (long) (125 * BIT_LENGTH_MULTIPLIER);   // nano seconds
    private final static int START_DELAY = 0;   // ms
    private final static int INIT_DUR = 10;     // s
    private final static boolean[] START_PATTERN =
            {false, true, true, false, true, false, true, true}; // "01101011";
    private final static boolean[] START_PATTERN_HAMMING =
            {false, true, true, false, true, false, false, false}; // "01101000";


    private ScheduledExecutorService timer;
    private Timer initTimer;
    private final Emitter emitter;
    private final boolean encodeWithHamming;
    private final TextView statusText;

    private TransmitterState state = TransmitterState.STOPPED;
    private boolean currentInitBit = true;
    private int currentIndex;
    private byte[] binaryLength;
    private byte[] binaryData;
    private byte[] binaryCrc;
    private boolean[] startPattern = START_PATTERN;


    public Transmitter(final Emitter emitter, final boolean encodeWithHamming,  TextView statusText) {
        this.emitter = emitter;
        this.encodeWithHamming = encodeWithHamming;
        this.statusText = statusText;
    }

    public byte[] concat(byte[] a, byte[] b) {
        int aLen = a.length;
        int bLen = b.length;
        byte[] c= new byte[aLen+bLen];
        System.arraycopy(a, 0, c, 0, aLen);
        System.arraycopy(b, 0, c, aLen, bLen);
        return c;
    }

    public void transmit(final String data) {
        try {
            binaryLength = ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(data.length()).array();

            binaryData = data.getBytes("UTF-8"); // or use "US-ASCII"?

            CRC32 crc = new CRC32();
            crc.update(binaryData);
            long crcSum = crc.getValue();
            binaryCrc = ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(new Long(crcSum).intValue()).array();
        } catch (UnsupportedEncodingException e) {
            // TODO: show error
            return;
        }

        // prepend length and append crc32 checksum to data
        binaryData = concat(concat(binaryLength, binaryData), binaryCrc);

        if(encodeWithHamming) {
            binaryData = HammingEncoder.encode(binaryData);
            startPattern = START_PATTERN_HAMMING;
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
        timer = Executors.newScheduledThreadPool(1);
        initTimer = new Timer();

        // call tick with a fixed period
        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                tick();
            }
        }, START_DELAY, BIT_LENGTH, TimeUnit.NANOSECONDS);

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
                        timer.shutdownNow();
                    } catch (Exception e) {
                        // already canceled
                        timer = null;
                    }
                    emitter.emitBit(null);
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
            final TextView textView = this.statusText;
            final String statusString = newState.toString();
            textView.post(new Runnable() {
                public void run() {
                    textView.setText(statusString);
                }
            });
            state = newState;
            currentIndex = 0;
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
            timer.shutdownNow();
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

    public void setBitLength(double bitLengthMs) {
        BIT_LENGTH = (long) (bitLengthMs * BIT_LENGTH_MULTIPLIER);
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
            output[2 * i] = encodeHalfByte((char) (input[i] >> 4));
            output[2 * i + 1] = encodeHalfByte((char) (input[i] & 0x0F));
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

