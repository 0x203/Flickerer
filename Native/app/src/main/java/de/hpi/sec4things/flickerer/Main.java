package de.hpi.sec4things.flickerer;

import de.hpi.sec4things.flickerer.transmission.Emitter;
import de.hpi.sec4things.flickerer.transmission.Flasher;
import de.hpi.sec4things.flickerer.transmission.Transmitter;
import de.hpi.sec4things.flickerer.util.SystemUiHider;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.SeekBar;
import android.widget.TextView;


/**
 * An example full-screen activity that shows and hides the system UI (i.e.
 * status bar and navigation/system bar) with user interaction.
 *
 * @see SystemUiHider
 */
public class Main extends Activity implements Emitter{
    /**
     * Whether or not the system UI should be auto-hidden after
     * {@link #AUTO_HIDE_DELAY_MILLIS} milliseconds.
     */
    private static final boolean AUTO_HIDE = false;

    /**
     * If {@link #AUTO_HIDE} is set, the number of milliseconds to wait after
     * user interaction before hiding the system UI.
     */
    private static final int AUTO_HIDE_DELAY_MILLIS = 3000;

    /**
     * If set, will toggle the system UI visibility upon interaction. Otherwise,
     * will show the system UI visibility upon interaction.
     */
    private static final boolean TOGGLE_ON_CLICK = false;

    /**
     * Whether or not to encode date with Hamming code
     */
    private static final boolean USE_HAMMING = true;


    /**
     * The flags to pass to {@link SystemUiHider#getInstance}.
     */
    private static final int HIDER_FLAGS = SystemUiHider.FLAG_HIDE_NAVIGATION;

    private static final double PERIOD_LENGTH = 7.8125;

    /**
     * The instance of the {@link SystemUiHider} for this activity.
     */
    private SystemUiHider mSystemUiHider;

    private View fullscreenBackground ;
    private EditText edit_data;
    private TextView seekBarText;
    private TextView statusText;
    private SeekBar seekBar;
    private Transmitter transmitter;
    private Flasher flasher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_main);

        // set variables
        final View controlsView = findViewById(R.id.fullscreen_content_controls);
        final View contentView = findViewById(R.id.fullscreen_content);
        fullscreenBackground = (View) controlsView.getParent();
        edit_data = (EditText) findViewById(R.id.edit_data);
        seekBar = (SeekBar) findViewById(R.id.seekBar);
        seekBarText = (TextView) findViewById(R.id.seekBarText);
        statusText = (TextView) findViewById(R.id.statusText);


        transmitter = new Transmitter(this, USE_HAMMING, statusText);
        CompoundButton flashlightToggle = (CompoundButton) findViewById(R.id.flashlighttogglebutton);
        if (!this.getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA)) {
            // no flashlight available
            flashlightToggle.setVisibility(View.GONE);
        } else {
            // flashlight available
            final Emitter self = this;
            flashlightToggle.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
                public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                    if (isChecked) {
                        if (flasher == null)
                            flasher = new Flasher();
                        transmitter.setEmitter(flasher);
                    } else {
                        transmitter.setEmitter(self);
                    }
                }
            });
            flashlightToggle.setChecked(true);
        }

        // Set up listener for send event
        edit_data.setOnEditorActionListener(new TextView.OnEditorActionListener() {
            @Override
            public boolean onEditorAction(TextView v, int actionId, KeyEvent event) {
                boolean handled = false;
                if (actionId == EditorInfo.IME_ACTION_SEND) {
                    hideKeyboard();
                    handled = true;
                    sendData(v);
                }
                return handled;
            }
        });

        // Set up listener for on seek bar change event
        seekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar s, int progress, boolean fromUser) {
                double bitLengthMs = Math.max(progress, 1) * PERIOD_LENGTH;
                seekBarText.setText(Double.toString(bitLengthMs));
                setBitLength(bitLengthMs);
            }

            @Override
            public void onStartTrackingTouch(SeekBar s) {}

            @Override
            public void onStopTrackingTouch(SeekBar s) {}
        });

        // Set up an instance of SystemUiHider to control the system UI for
        // this activity.
        mSystemUiHider = SystemUiHider.getInstance(this, contentView, HIDER_FLAGS);
        mSystemUiHider.setup();
        mSystemUiHider
                .setOnVisibilityChangeListener(new SystemUiHider.OnVisibilityChangeListener() {
                    // Cached values.
                    int mControlsHeight;
                    int mShortAnimTime;

                    @Override
                    @TargetApi(Build.VERSION_CODES.HONEYCOMB_MR2)
                    public void onVisibilityChange(boolean visible) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB_MR2) {
                            // If the ViewPropertyAnimator API is available
                            // (Honeycomb MR2 and later), use it to animate the
                            // in-layout UI controls at the bottom of the
                            // screen.
                            if (mControlsHeight == 0) {
                                mControlsHeight = controlsView.getHeight();
                            }
                            if (mShortAnimTime == 0) {
                                mShortAnimTime = getResources().getInteger(
                                        android.R.integer.config_shortAnimTime);
                            }
                            controlsView.animate()
                                    .translationY(visible ? 0 : mControlsHeight)
                                    .setDuration(mShortAnimTime);
                        } else {
                            // If the ViewPropertyAnimator APIs aren't
                            // available, simply show or hide the in-layout UI
                            // controls.
                            controlsView.setVisibility(visible ? View.VISIBLE : View.GONE);
                        }

                        if (visible && AUTO_HIDE) {
                            // Schedule a hide().
                            delayedHide(AUTO_HIDE_DELAY_MILLIS);
                        }
                    }
                });

        // Set up the user interaction to manually show or hide the system UI.
        contentView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if (TOGGLE_ON_CLICK) {
                    mSystemUiHider.toggle();
                } else {
                    mSystemUiHider.show();
                }
            }
        });

        // Upon interacting with UI controls, delay any scheduled hide()
        // operations to prevent the jarring behavior of controls going away
        // while interacting with the UI.
        findViewById(R.id.send_data).setOnTouchListener(mDelayHideTouchListener);
        findViewById(R.id.stop_sending).setOnTouchListener(mDelayHideTouchListener);
    }

    @Override
    protected void onPostCreate(Bundle savedInstanceState) {
        super.onPostCreate(savedInstanceState);

        // Trigger the initial hide() shortly after the activity has been
        // created, to briefly hint to the user that UI controls
        // are available.
        //delayedHide(100);
    }


    /**
     * Touch listener to use for in-layout UI controls to delay hiding the
     * system UI. This is to prevent the jarring behavior of controls going away
     * while interacting with activity UI.
     */
    View.OnTouchListener mDelayHideTouchListener = new View.OnTouchListener() {
        @Override
        public boolean onTouch(View view, MotionEvent motionEvent) {
            if (AUTO_HIDE) {
                delayedHide(AUTO_HIDE_DELAY_MILLIS);
            }
            return false;
        }
    };

    Handler mHideHandler = new Handler();
    Runnable mHideRunnable = new Runnable() {
        @Override
        public void run() {
            mSystemUiHider.hide();
        }
    };

    /**
     * Schedules a call to hide() in [delay] milliseconds, canceling any
     * previously scheduled calls.
     */
    private void delayedHide(int delayMillis) {
        mHideHandler.removeCallbacks(mHideRunnable);
        mHideHandler.postDelayed(mHideRunnable, delayMillis);
    }

    public void sendData(View view) {
        // either sendButton was clicked or send action from text field was triggered
        String data = edit_data.getText().toString();
        transmitter.transmit(data);
    }

    public void stopSending(View view) {
        // Stop button was clicked
        transmitter.stop();
    }

    public void setBitLength(double bitLengthMs) {
        transmitter.setBitLength(bitLengthMs);
    }

    private void hideKeyboard() {
        // http://stackoverflow.com/a/7696791/2148890
        // Check if no view has focus:
        View view = this.getCurrentFocus();
        if (view != null) {
            InputMethodManager inputManager = (InputMethodManager) this.getSystemService(Context.INPUT_METHOD_SERVICE);
            inputManager.hideSoftInputFromWindow(view.getWindowToken(), InputMethodManager.HIDE_NOT_ALWAYS);
        }
    }

    @Override
    public void emitBit(final Boolean bit) {
        runOnUiThread(new Runnable() {
            // this is needed, because we are called from a background thread which can't update the view
            @Override
            public void run() {
                if (bit == null) {
                    // isch over
                    fullscreenBackground.setBackgroundColor(Color.TRANSPARENT);
                } else {
                    // really emit bit
                    fullscreenBackground.setBackgroundColor(bit ? Color.WHITE : Color.BLACK);
                }
            }
        });
    }
}
