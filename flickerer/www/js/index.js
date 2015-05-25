(function () {

    var inputState = {
        initializePattern: null,
        initializeDuration: null,
        transmitData: null,
        bitDuration: null,
        paused: false
    };
    var index;
    var timeoutId;

    var nextBit = function() {
        var truthy = inputState.transmitData[index] === '1';
        index = (index + 1) % inputState.transmitData.length;

        $('body').toggleClass('black', truthy);

        timeoutId = setTimeout(nextBit, inputState.bitDuration);
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
        if(timeoutId) {
            clearTimeout(timeoutId);
        }
        index = 0;
        nextBit();
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
               if(timeoutId) {
                    clearTimeout(timeoutId);
                }
            } else {
                startTransmission();
            }

            $(this).toggleClass('paused', inputState.paused);
            e.stopPropagation();
        });

        uiChange();
    });
})();
