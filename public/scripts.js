$(function () {
    (function () {

        var handle = $(".js-slider-handle"),
            text = $(".js-slider-text");

        $( ".js-slider" ).slider({
            range: "min",
            value: 5,
            min: 5,
            max: 15,
            create: function() {
                text.text( $(this).slider( "value" ) );
            },
            slide: function( event, ui ) {
                App.calc.tarif = Math.max(0, parseInt(ui.value) - 5);
                text.text( ui.value );
            }
        });

    })();
});