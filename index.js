(function () {

    var transmitData;
    var transmitDuration;
    var index;
    var timeoutId;

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
        index = 0;
        nextBit();
    };

    $('document').ready(function(){
        $('body').click(function() {
            $('.controls').toggleClass('hidden');
        });

        $('.controls').on({
            click: function(e) {
                // do not hide controls when they are clicked directly
                e.stopPropagation();
            },
            change: function(e) {
                transmitData = $('#transmit_data').val();
                transmitDuration = $('#transmit_duration').val();
                $('output[for=transmit_duration]').val(transmitDuration);

                startTransmission();
            }
        });
    });
})();
