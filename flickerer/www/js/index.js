Transmitter = (function() {
    var Transmitter = function(inputs, emitBit, notify){
        this.emitBit = emitBit;     // function to output one bit
        this.notify = notify;       // function to notify state changes

        this.bitDuration = inputs.bitDuration;
        this.initPattern = decodeData(inputs.initializePattern, 'binary');
        this.initDuration = inputs.initializeDuration * 1000;   // from s to ms
        this.startPattern = decodeData(inputs.startPattern, 'binary');
        this.dataWorkload = decodeData(inputs.transmitData, 'binary');

        this.state = this.STATES.stopped;
        this.running = false;
        this.cur_index = null;
    };

    Transmitter.prototype.STATES = {
        stopped: 0,
        running: 1,
        initializing: 2,
        starting: 3,
        transmitting: 4
    };

    Transmitter.prototype.start = function() {
        this.changeState(this.STATES.running);
        this.tick();
    };

    Transmitter.prototype.tick = function() {
        switch (this.state) {
            case this.STATES.stopped:
                // don't set another timeout
                return;
            case this.STATES.running:
                this.changeState(this.STATES.initializing);
                setTimeout(this.initialized.bind(this), this.initDuration);
                break;
            case this.STATES.initializing:
                this.emitBit(this.initPattern[this.cur_index]);
                this.cur_index = (this.cur_index + 1) % this.initPattern.length;
                break;
            case this.STATES.starting:
                this.emitBit(this.startPattern[this.cur_index]);
                this.cur_index += 1;
                if(this.cur_index === this.startPattern.length) {
                    this.changeState(this.STATES.transmitting);
                }
                break;
            case this.STATES.transmitting:
                this.emitBit(this.dataWorkload[this.cur_index]);
                this.cur_index += 1;
                if(this.cur_index === this.dataWorkload.length) {
                    this.changeState(this.STATES.stopped);
                }
                break;
        }

        this.timeoutId = setTimeout(this.tick.bind(this), this.bitDuration);
    };

    Transmitter.prototype.changeState = function(newState) {
        if(this.state !== newState) {
            this.state = newState;
            this.cur_index = 0;
            this.notify(newState);
        }
    };

    Transmitter.prototype.stop = function() {
        this.changeState(this.STATES.stopped);
    };

    Transmitter.prototype.initialized = function() {
        if(this.state === this.STATES.initializing) {
            // continue with sending start pattern
            this.changeState(this.STATES.starting);
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

    return Transmitter;
})();


(function () {

    var transmitter;
    var inputState = {
        initializePattern: null,
        initializeDuration: null,
        startPattern: null,
        transmitData: null,
        bitDuration: null
    };

    var emitBit = function(bit) {
        $('body').toggleClass('black', bit);
    };

    var dataChange = function() {
        readInputs();
        adjustOutputs();
        if(transmitter) {
            transmitter.stop();
        }
        transmitter = new Transmitter(inputState, emitBit, stateChange);
    };

    var readInputs = function() {
        inputState.initializePattern = $('#initialize_pattern').val();
        inputState.initializeDuration = $('#initialize_duration').val();
        inputState.startPattern = $('#start_pattern').val();
        inputState.transmitData = $('#transmit_data').val();
        inputState.bitDuration = $('#bit_duration').val();
    };

    var adjustOutputs = function() {
        $('output[for=initialize_duration]').val(inputState.initializeDuration);
        $('output[for=bit_duration]').val(inputState.bitDuration);
    };

    var stateChange = function(newState) {
        $('body').toggleClass('gray', newState === transmitter.STATES.stopped);
        $('.input-init').toggleClass('active', newState === transmitter.STATES.initializing);
        $('.input-start').toggleClass('active', newState === transmitter.STATES.starting);
        $('.input-data').toggleClass('active', newState === transmitter.STATES.transmitting);
    };

    $('document').ready(function(){
        dataChange();

        $(document).click(function() {
            $('.controls').toggleClass('hidden');
        });

        $('.controls').on({
            click: function(e) {
                // do not hide controls when they are clicked directly
                e.stopPropagation();
            },
            change: dataChange
        });

        $('.start').on('click', function(e) {
            transmitter.stop();
            transmitter.start();
            e.stopPropagation();
        });

        $('.stop').on('click', function(e) {
            transmitter.stop();
            e.stopPropagation();
        });
    });
})();
