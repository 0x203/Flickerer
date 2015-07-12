Transmitter = (function() {
    function encodeHamming(input) {
        function mult(dataArray) {
            var G = [
                [1,1,0,1],
                [1,0,1,1],
                [1,0,0,0],
                [0,1,1,1],
                [0,1,0,0],
                [0,0,1,0],
                [0,0,0,1]
            ]

            result = [];
            for (var i = 0; i < G.length; i++) {
                var sum = 0;
                for (var j = 0; j < G[i].length; j++) {
                    sum += G[i][j] * dataArray[j];
                }
                result.push(sum % 2);
            }

            return result;
        }

        var hamming = [];
        for (var i = 0; i < input.length; i+=4) {
            var chunkArr = input.substring(i, i+4).split('').map(function(el) {
                return parseInt(el);
            });

            var hammingChunk = mult(chunkArr);
            // add parity bit
            var parity = hammingChunk.reduce(function(sum, val) { return sum + val; }, 0) % 2;
            hammingChunk = hammingChunk.join('') + parity;
            
            hamming.push(hammingChunk);
        }

        return hamming.join('');
    }

    var Transmitter = function(inputs, emitBit, notify){
        this.emitBit = emitBit;     // function to output one bit
        this.notify = notify;       // function to notify state changes

        this.bitDuration = inputs.bitDuration;
        this.initPattern = inputs.initializePattern;
        this.initDuration = inputs.initializeDuration * 1000;   // from s to ms
        this.startPattern = inputs.startPattern;
        this.dataWorkload = decodeData(inputs.transmitData);
        if (inputs.useHamming) {
            // options for: 8,4 Hamming; 4 data bits with 4 paritiy bits
            var chunkSize = 4;
            var useParityBit = true;
            this.dataWorkload = encodeHamming(this.dataWorkload);
        }

        this.state = this.STATES.stopped;
        this.running = false;
        this.cur_index = null;

        _this = this;
        var errorHandler = function(offset) {
            _this.selfSyncTimer.clearInterval();
            _this.stop();
            alert("Unfortunately a timer delay of " + offset + "ms was caused, please restart the initialization!");
        };

        this.selfSyncTimer = new SynchronizedTimer(errorHandler, 0.45);
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
        this.selfSyncTimer.setInterval(this.tick.bind(this), this.bitDuration);
    };

    Transmitter.prototype.tick = function() {

        switch (this.state) {
            case this.STATES.stopped:
                // clear the ticking interval
                this.selfSyncTimer.clearInterval();
                return;
            case this.STATES.running:
                this.changeState(this.STATES.initializing);
                setTimeout(this.initialized.bind(this), this.initDuration);
                break;
            case this.STATES.initializing:
                this.emitBit(this.initPattern[this.cur_index] === '1');
                this.cur_index = (this.cur_index + 1) % this.initPattern.length;
                break;
            case this.STATES.starting:
                this.emitBit(this.startPattern[this.cur_index] === '1');
                this.cur_index += 1;
                if(this.cur_index === this.startPattern.length) {
                    this.changeState(this.STATES.transmitting);
                }
                break;
            case this.STATES.transmitting:
                if(this.cur_index === this.dataWorkload.length) {
                    this.changeState(this.STATES.stopped);
                    break;
                }
                this.emitBit(this.dataWorkload[this.cur_index] === '1');
                this.cur_index += 1;
                break;
        }
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

    var decodeData = function(data) {
        decoded = [];
        var len = data.length;
        var binary;

        for(var i = 0; i < len; i++) {
            // first, read utf-16 code of char, then convert it to binry number string
            binary = data.charCodeAt(i).toString(2);
            decoded.push('0'.repeat(8 - binary.length) + binary);
        }
        return decoded.join("");
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
        useHamming: false,
        bitDuration: null
    };

    var emitBit = function(bit) {
        $('body').toggleClass('black', !bit);
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
        inputState.useHamming = $('#use_hamming').prop('checked');
    };

    var adjustOutputs = function() {
        $('output[for=initialize_duration]').val(inputState.initializeDuration);
        $('output[for=bit_duration]').val(inputState.bitDuration);
    };

    var stateChange = function(newState) {
        if(newState === transmitter.STATES.stopped) {
            $('body').removeClass('black');
        }
        $('body').toggleClass('gray', newState === transmitter.STATES.stopped);
        $('.input-init').toggleClass('active', newState === transmitter.STATES.initializing);
        $('.input-start').toggleClass('active', newState === transmitter.STATES.starting);
        $('.input-data').toggleClass('active', newState === transmitter.STATES.transmitting);
    };

    $(document).ready(function(){
        dataChange();

        $(document).on("click touch", function() {
            $('.controls').toggleClass('hidden');
        });

        $("input, textarea, button").on("click touch", function(e) {
            e.stopPropagation();
        });

        $('.controls').on({
            change: dataChange,
            input: dataChange
        });

        $('.start').on('click', function(e) {
            transmitter.stop();
            transmitter.start();
        });

        $('.stop').on('click', function(e) {
            transmitter.stop();
        });
    });
})();
