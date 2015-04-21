(function () {

    var transmitData;
    var transmitDuration;

    $('document').ready(function(){
        $('body').click(function() {
            //$(this).toggleClass('black');
            $('.controls').toggleClass('hidden');
        });

        $('.controls').click(function(e) {
            // do not hide controls when they are clicked directly
            e.stopPropagation();
        });

        $('#transmit_data').on('change', function() {
            transmitData = $('this').val();
        });

        $('#transmit_duration').on('change', function() {
            transmitDuration = $(this).val();
            $('output[for=transmit_duration]').val(transmitDuration);
        });
    });

})();
