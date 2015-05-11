(function () {

    var transmitData;
    var transmitDuration;
    var index;
    var timeoutId;
    var paused = false;

    var nextBit = function() {
        var truthy = transmitData[index] === "1";
        index = (index + 1) % transmitData.length;

        $('body').toggleClass('black', truthy);

        timeoutId = setTimeout(nextBit, transmitDuration);
    };

    var startTransmission = function() {
        if(timeoutId) {
            clearTimeout(timeoutId);
        }
        transmitData = $('#transmit_data').val();
        transmitDuration = $('#transmit_duration').val();
        $('output[for=transmit_duration]').val(transmitDuration);
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
            change: startTransmission
        });

        $('.pause').on('click', function(e) {
            paused = !paused;
            if(paused) {
               if(timeoutId) {
                    clearTimeout(timeoutId);
                }
            } else {
                startTransmission();
            }

            $(this).toggleClass('paused', paused);
            e.stopPropagation();
        });

        startTransmission();
    });
})();
