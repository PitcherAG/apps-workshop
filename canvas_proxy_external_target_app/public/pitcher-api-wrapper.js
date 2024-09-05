const pitcherApiWrapper = (function () {
    const PITCHER_ORIGIN = "https://dev.my.pitcher.com"; // Replace with actual Pitcher domain

    function sendRequest(target, method, args = []) {
        return new Promise((resolve, reject) => {
            const id = Date.now().toString();
            const message = { id, target, method, args };

            const handler = (event) => {
                if (event.source !== window.parent) return;
                if (event.data.id !== id) return;

                window.removeEventListener('message', handler);

                if (event.data.success) {
                    resolve(event.data.data);
                } else {
                    reject(new Error(event.data.error));
                }
            };

            window.addEventListener('message', handler);
            window.parent.postMessage(message, PITCHER_ORIGIN);
        });
    }

    function createProxy(target) {
        return new Proxy({}, {
            get: function (obj, prop) {
                return function (...args) {
                    return sendRequest(target, prop, args);
                };
            }
        });
    }

    return {
        pitcherApi: createProxy('api'),
        pitcherUiApi: createProxy('uiApi')
    };
})();

// Export the APIs for use in other files
export const pitcherApi = pitcherApiWrapper.pitcherApi;
export const pitcherUiApi = pitcherApiWrapper.pitcherUiApi;