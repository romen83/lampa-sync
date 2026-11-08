(function () {
    'use strict';

    const CONFIG = {
        binId: '6af05759ac6210605a771d47',
        apiKey: '$2a$10$L7Ww9WWb6xBYSaGrL2rNTe60Ohmz4IsI2605J1PznHYY1KZ8lrEJS'
    };

    if (window.lampa_sync_plugin) return;
    window.lampa_sync_plugin = true;

    function fetchCloudTimecodes(callback) {
        $.ajax({
            url: `https://api.jsonbin.io/v3/b/${CONFIG.binId}/latest`,
            type: 'GET',
            headers: {
                'X-Master-Key': CONFIG.apiKey
            },
            success: function (data) {
                callback(data.record || {});
            },
            error: function (err) {
                console.log('Lampa Sync Error (Get):', err);
            }
        });
    }

    function saveCloudTimecodes(data) {
        $.ajax({
            url: `https://api.jsonbin.io/v3/b/${CONFIG.binId}`,
            type: 'PUT',
            contentType: 'application/json',
            headers: {
                'X-Master-Key': CONFIG.apiKey
            },
            data: JSON.stringify(data),
            success: function () {
                console.log('Lampa Sync: Saved successfully to cloud!');
            },
            error: function (err) {
                console.log('Lampa Sync Error (Save):', err);
            }
        });
    }

    Lampa.Listener.follow('player', function (e) {
        if (!e.target) return;

        // Коли плеєр завантажився — намагаємося відновити таймкод
        if (e.type === 'ready') {
            const card = e.target.card || (Lampa.Player.data && Lampa.Player.data.movie);
            const id = card ? (card.id || card.kinopoisk_id || card.imdb_id) : null;
            if (!id) return;

            fetchCloudTimecodes(function (cloudData) {
                if (cloudData[id] && cloudData[id].time) {
                    const savedTime = cloudData[id].time;
                    if (e.target.video && savedTime > 5) {
                        e.target.video.currentTime = savedTime;
                        Lampa.Noty.show('Таймкод відновлено: ' + Math.floor(savedTime) + ' сек');
                    }
                }
            });
        }

        // Коли змінюється час або закривається плеєр — зберігаємо
        if (e.type === 'destroy' || e.type === 'timeupdate') {
            const card = e.target.card || (Lampa.Player.data && Lampa.Player.data.movie);
            const id = card ? (card.id || card.kinopoisk_id || card.imdb_id) : null;
            
            if (!id || !e.target.video) return;
            const currentTime = Math.floor(e.target.video.currentTime);

            // Зберігаємо тільки якщо пройшло більше 10 секунд
            if (currentTime > 10) {
                // Робимо невелику затримку для timeupdate, щоб не спамити запитами
                if (e.type === 'timeupdate') {
                    if (currentTime % 15 !== 0) return; // Зберігаємо кожні 15 секунд перегляду
                }

                fetchCloudTimecodes(function (cloudData) {
                    cloudData[id] = {
                        time: currentTime,
                        title: card.title || card.name || 'Unknown',
                        updated: Date.now()
                    };
                    saveCloudTimecodes(cloudData);
                });
            }
        }
    });
})();
