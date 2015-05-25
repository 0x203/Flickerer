Tranmittor = (function() {
    var Tranmittor = function(inputs, emitBit){
        this.emitBit = emitBit;     // function to output one bit

        this.bitDuration = inputs.bitDuration;
        this.initPattern = decodeData(inputs.initializePattern, 'binary');
        this.initDuration = inputs.initializeDuration * 1000;   // from s to ms
        this.startPattern = decodeData('11110000', 'binary');  //inputs.startPattern;
        this.dataWorkload = decodeData(inputs.transmitData, 'binary');

        this.state = STATES.stopped;
        this.running = false;
        this.cur_index = null;
    };

    var STATES = {
        stopped: 0,
        running: 1,
        initializing: 2,
        starting: 3,
        transmitting: 4
    };

    Tranmittor.prototype.start = function() {
        this.state = STATES.running;
        this.cur_index = 0;
        this.tick();
    };

    Tranmittor.prototype.tick = function() {
        switch (this.state) {
            case STATES.stopped:
                // don't set another timeout
                return;
            case STATES.running:
                this.state = STATES.initializing;
                this.cur_index = 0;
                setTimeout(this.initialized.bind(this), this.initDuration);
                break;
            case STATES.initializing:
                this.emitBit(this.initPattern[this.cur_index]);
                this.cur_index = (this.cur_index + 1) % this.initPattern.length;
                break;
            case STATES.starting:
                this.emitBit(this.startPattern[this.cur_index]);
                this.cur_index += 1;
                if(this.cur_index === this.startPattern.length) {
                    this.cur_index = 0;
                    this.state = STATES.transmitting;
                }
                break;
            case STATES.transmitting:
                this.emitBit(this.dataWorkload[this.cur_index]);
                this.cur_index += 1;
                if(this.cur_index === this.dataWorkload.length) {
                    this.cur_index = 0;
                    this.state = STATES.stopped;
                }
                break;
        }

        this.timeoutId = setTimeout(this.tick.bind(this), this.bitDuration);
    };

    Tranmittor.prototype.stop = function() {
        this.state = STATES.stopped;
    };

    Tranmittor.prototype.initialized = function() {
        if(this.state === STATES.initializing) {
            // continue with sending start pattern
            this.cur_index = 0;
            this.state = STATES.starting;
        }
    };

    var decodeData = function(data, encoding) {
        var decoded = [];
        if(encoding === 'binary') {
            var len = data.length;
            for(var i = 0; i < len; i++) {
                decoded.push(data[i] === '1');
            }
        } else {
            console.warn('Implement me!');
            decoded = [0, 1, 0, 1, 1];
        }
        return decoded;
    };

    return Tranmittor;
})();


(function () {

    var transmitter;
    var inputState = {
        initializePattern: null,
        initializeDuration: null,
        transmitData: null,
        bitDuration: null,
        paused: false
    };

    var emitBit = function(bit) {
        $('body').toggleClass('black', bit);
    };

    var uiChange = function() {
        readInputs();
        adjustOutputs();
        if(!inputState.paused) {
            startTransmission();
        }
    };

    var readInputs = function() {
        inputState.initializePattern = $('#initialize_pattern').val();
        inputState.initializeDuration = $('#initialize_duration').val();
        inputState.transmitData = $('#transmit_data').val();
        inputState.bitDuration = $('#bit_duration').val();
    };

    var adjustOutputs = function() {
        $('output[for=initialize_duration]').val(inputState.initializeDuration);
        $('output[for=bit_duration]').val(inputState.bitDuration);
    };

    var startTransmission = function() {
        transmitter = new Tranmittor(inputState, emitBit);
        transmitter.start();
    };

    $('document').ready(function(){
        $(document).click(function() {
            $('.controls').toggleClass('hidden');
        });

        $('.controls').on({
            click: function(e) {
                // do not hide controls when they are clicked directly
                e.stopPropagation();
            },
            change: uiChange
        });

        $('.pause').on('click', function(e) {
            inputState.paused = !inputState.paused;
            if(inputState.paused) {
                transmitter.stop();
            } else {
                transmitter.start();
            }

            $(this).toggleClass('paused', inputState.paused);
            e.stopPropagation();
        });

        uiChange();
    });
})();
