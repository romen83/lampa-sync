(function () {
    'use strict';

    const CONFIG = {
        binId: '6af0938affd5d16053b136cc',
        apiKey: '$2a$10$tPDvcNxaQBCtXl.myb400Zc13gfYmRl.a2NxailyCKVyOLRu2yii'
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
                console.log('Lampa Sync Error:', err);
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
                console.log('Lampa Sync: Timecodes updated successfully');
            }
        });
    }

    Lampa.Listener.follow('player', function (e) {
        if (!e.target) return;

        if (e.type === 'ready') {
            let id = null;
            if (e.target.card && e.target.card.id) {
                id = e.target.card.id;
            }
            if (!id) return;

            fetchCloudTimecodes(function (cloudData) {
                if (cloudData[id] && cloudData[id].time) {
                    const localTime = Lampa.Storage.get('time_' + id, 0);
                    if (cloudData[id].time > localTime) {
                        Lampa.Storage.set('time_' + id, cloudData[id].time);
                        if (e.target.video) {
                            e.target.video.currentTime = cloudData[id].time;
                        }
                        Lampa.Noty.show('Таймкод відновлено з хмари');
                    }
                }
            });
        }

        if (e.type === 'destroy' || e.type === 'timeupdate') {
            let id = null;
            if (e.target.card && e.target.card.id) {
                id = e.target.card.id;
            }

            let currentTime = 0;
            if (e.target.video && e.target.video.currentTime) {
                currentTime = Math.floor(e.target.video.currentTime);
            }

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
