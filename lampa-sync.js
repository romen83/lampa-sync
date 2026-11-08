(function () {
    'use strict';

    if (window.lampa_sync_test_loaded) return;
    window.lampa_sync_test_loaded = true;

    Lampa.Noty.show('Тестовий плагін успішно завантажився!');

    Lampa.Listener.follow('player', function (e) {
        if (e.type === 'ready') {
            Lampa.Noty.show('Плеєр відкрито! ID картки: ' + (e.target.card ? e.target.card.id : 'немає ID'));
            console.log('Lampa Player Card:', e.target.card);
        }
    });
})();
