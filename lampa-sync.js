(function () {
    'use strict';

    // === НАЛАШТУВАННЯ ===
    const CONFIG = {
        binId: '6af05759ac6210605a771d47',
        apiKey: '$2a$10$L7Ww9WWb6xBYSaGrL2rNTe60Ohmz4IsI2605J1PznHYY1KZ8lrEJS'
    };

    if (window.lampa_sync_plugin) return;
    window.lampa_sync_plugin = true;

    // Отримання таймкодів з хмари
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
                console.log('Lampa Sync Error:', err);
            }
        });
    }

    // Збереження таймкодів у хмару
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
                console.log('Lampa Sync: Timecodes updated successfully');
            }
        });
    }

    // Підключення до подій плеєра Lampa
    Lampa.Listener.follow('player', function (e) {
        if (e.type === 'ready') {
            const id = e.target.card ? e.target.card.id : null;
            if (!id) return;

            fetchCloudTimecodes(function (cloudData) {
                if (cloudData[id] && cloudData[id].time) {
                    const localTime = Lampa.Storage.get('time_' + id, 0);
                    if (cloudData[id].time > localTime) {
                        Lampa.Storage.set('time_' + id, cloudData[id].time);
                        e.target.video.currentTime = cloudData[id].time;
                        Lampa.Noty.show('Таймкод відновлено з хмари');
                    }
                }
            });
        }

        if (e.type === 'destroy' || e.type === 'timeupdate') {
            const id = e.target.card ? e.target.card.id : null;
            const currentTime = Math.floor(e.target.video ? e.target.video.currentTime : 0);

            if (id && currentTime > 10) {
                fetchCloudTimecodes(function (cloudData) {
                    cloudData[id] = {
                        time: currentTime,
                        updated: Date.now()
                    };
                    saveCloudTimecodes(cloudData);
                });
            }
        }
    });
})();
