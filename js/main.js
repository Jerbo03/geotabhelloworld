(function () {
    "use strict";

    console.info("[HelloGeotab] main.js cargado.");

    if (!window.geotab) {
        console.error(
            "[HelloGeotab] No se encontró window.geotab. " +
            "El Add-In debe ejecutarse desde MyGeotab."
        );
        return;
    }

    window.geotab.addin = window.geotab.addin || {};

    window.geotab.addin.helloWorld = function (initialApi, initialState) {

        // ============================================================
        // CONFIGURATION
        // ============================================================

        var DEVICE_ID_FOR_TEST = "b315";
        var TEST_PACKET = [5];

        // ============================================================
        // INTERNAL VARIABLES
        // ============================================================

        var api = initialApi || null;
        var state = initialState || null;

        var loadingVehicles = false;
        var sendingMessage = false;

        // ============================================================
        // DOM HELPERS
        // ============================================================

        function element(id) {
            return document.getElementById(id);
        }

        function setText(id, value) {
            var node = element(id);

            if (node) {
                node.textContent = value == null ? "" : String(value);
            }
        }

        function setDisabled(id, disabled) {
            var node = element(id);

            if (node) {
                node.disabled = Boolean(disabled);
            }
        }

        function getErrorMessage(err) {
            if (err == null) {
                return "Error desconocido.";
            }

            if (typeof err === "string") {
                return err;
            }

            if (err.message) {
                return err.message;
            }

            try {
                return JSON.stringify(err);
            } catch (e) {
                return String(err);
            }
        }

        // ============================================================
        // NAVIGATION
        // ============================================================

        function goToVehiclesPage() {
            if (!state || typeof state.gotoPage !== "function") {
                setText("error", "La navegación de MyGeotab no está disponible.");
                return;
            }

            state.gotoPage("devices");
        }

        function openDevice(deviceId) {
            if (!deviceId) {
                return;
            }

            if (!state || typeof state.gotoPage !== "function") {
                setText("error", "La navegación de MyGeotab no está disponible.");
                return;
            }

            state.gotoPage("device", { id: deviceId });
        }

        // ============================================================
        // VEHICLE LIST
        // ============================================================

        function renderVehicles(devices) {
            var list = element("vehicleList");

            if (!list) {
                console.error("[HelloGeotab] No existe #vehicleList.");
                return;
            }

            list.textContent = "";

            if (!devices || devices.length === 0) {
                var emptyItem = document.createElement("li");

                emptyItem.className = "hw-empty";
                emptyItem.textContent = "No se encontraron dispositivos.";

                list.appendChild(emptyItem);
                return;
            }

            devices.forEach(function (device) {
                var item = document.createElement("li");
                var nameButton = document.createElement("button");
                var idLabel = document.createElement("span");

                nameButton.type = "button";
                nameButton.className = "hw-device-link";
                nameButton.textContent = device.name || "Dispositivo sin nombre";

                nameButton.addEventListener("click", function () {
                    openDevice(device.id);
                });

                idLabel.className = "hw-device-id";
                idLabel.textContent = "ID: " + (device.id || "No disponible");

                item.appendChild(nameButton);
                item.appendChild(idLabel);

                list.appendChild(item);
            });
        }

        function getVehicles() {
            if (!api || typeof api.call !== "function") {
                setText("error", "La API de MyGeotab no está inicializada.");
                return;
            }

            if (loadingVehicles) {
                return;
            }

            loadingVehicles = true;

            setDisabled("vehiclesButton", true);

            setText("status", "Consultando dispositivos...");
            setText("error", "");
            setText("vehicleCount", "Consultando...");

            var list = element("vehicleList");

            if (list) {
                list.textContent = "";
            }

            console.info("[HelloGeotab] Consultando Device...");

            api.call(
                "Get",
                {
                    typeName: "Device",
                    resultsLimit: 10
                },

                // SUCCESS
                function (result) {
                    var devices = Array.isArray(result) ? result : [];

                    console.info(
                        "[HelloGeotab] Dispositivos recibidos:",
                        devices.length
                    );

                    renderVehicles(devices);

                    setText(
                        "vehicleCount",
                        devices.length + " dispositivos"
                    );

                    setText("status", "Consulta completada correctamente.");

                    loadingVehicles = false;
                    setDisabled("vehiclesButton", false);
                },

                // ERROR
                function (err) {
                    console.error("[HelloGeotab] Error en Get Device:", err);

                    setText("status", "Error al consultar dispositivos.");
                    setText("error", getErrorMessage(err));
                    setText("vehicleCount", "Error");

                    loadingVehicles = false;
                    setDisabled("vehiclesButton", false);
                }
            );
        }

        // ============================================================
        // MESSAGE TRANSMISSION
        // ============================================================

        function bytesToBase64(packet) {
            if (!Array.isArray(packet)) {
                throw new TypeError("El paquete debe ser un array de bytes.");
            }

            var binary = "";

            packet.forEach(function (byte, index) {
                if (
                    !Number.isInteger(byte) ||
                    byte < 0 ||
                    byte > 255
                ) {
                    throw new RangeError(
                        "Byte inválido en posición " + index + ": " + byte
                    );
                }

                binary += String.fromCharCode(byte);
            });

            return window.btoa(binary);
        }

        function sendMsg(deviceId, packet) {
            if (!api || typeof api.call !== "function") {
                setText(
                    "messageStatus",
                    "Error: API de MyGeotab no inicializada."
                );
                return;
            }

            if (sendingMessage) {
                return;
            }

            if (!deviceId) {
                setText("messageStatus", "Error: ID de dispositivo vacío.");
                return;
            }

            var base64Data;

            try {
                base64Data = bytesToBase64(packet);
            } catch (err) {
                setText(
                    "messageStatus",
                    "Error en el paquete: " + getErrorMessage(err)
                );
                return;
            }

            sendingMessage = true;

            setDisabled("sendMessageButton", true);
            setText("messageStatus", "Enviando solicitud a MyGeotab...");

            console.info("[HelloGeotab] Enviando TextMessage");
            console.info("Device:", deviceId);
            console.info("Packet:", packet);
            console.info("Base64:", base64Data);

            api.call(
                "Add",
                {
                    typeName: "TextMessage",

                    entity: {
                        device: {
                            id: deviceId
                        },

                        messageContent: {
                            contentType: "MimeContent",
                            channelNumber: 1,
                            mimeType: "text",
                            data: base64Data
                        },

                        isDirectionToVehicle: true,
                        messageSize: 235
                    }
                },

                // SUCCESS
                function (result) {
                    console.info(
                        "[HelloGeotab] TextMessage creado:",
                        result
                    );

                    setText(
                        "messageStatus",
                        "TextMessage creado en MyGeotab. ID: " +
                        String(result) +
                        ". Esto no confirma la recepción del equipo."
                    );

                    sendingMessage = false;
                    setDisabled("sendMessageButton", false);
                },

                // ERROR
                function (err) {
                    console.error(
                        "[HelloGeotab] Error al crear TextMessage:",
                        err
                    );

                    setText(
                        "messageStatus",
                        "Error al crear TextMessage: " +
                        getErrorMessage(err)
                    );

                    sendingMessage = false;
                    setDisabled("sendMessageButton", false);
                }
            );
        }

        // ============================================================
        // INITIALIZATION
        // ============================================================

        function initialize(apiObject, stateObject, callback) {
            api = apiObject || api;
            state = stateObject || state;

            console.info("[HelloGeotab] initialize() ejecutado.");

            var vehiclesButton = element("vehiclesButton");
            var gotoVehiclesButton = element("gotoVehiclesButton");
            var sendMessageButton = element("sendMessageButton");

            if (
                !vehiclesButton ||
                !gotoVehiclesButton ||
                !sendMessageButton
            ) {
                console.error(
                    "[HelloGeotab] No se encontraron todos los botones. " +
                    "Verifica los IDs del index.html."
                );

                setText("status", "Error: interfaz HTML incompleta.");

                if (typeof callback === "function") {
                    callback();
                }

                return;
            }

            // Consultar dispositivos
            vehiclesButton.addEventListener("click", getVehicles);

            // Abrir página nativa de vehículos
            gotoVehiclesButton.addEventListener(
                "click",
                goToVehiclesPage
            );

            // Enviar paquete de prueba
            sendMessageButton.addEventListener("click", function () {
                sendMsg(DEVICE_ID_FOR_TEST, TEST_PACKET);
            });

            setText("status", "Add-In inicializado.");
            setText(
                "messageStatus",
                "Dispositivo de prueba: " + DEVICE_ID_FOR_TEST
            );

            if (typeof callback === "function") {
                callback();
            }
        }

        // ============================================================
        // FOCUS / BLUR
        // ============================================================

        function focus(apiObject, stateObject) {
            api = apiObject || api;
            state = stateObject || state;

            console.info("[HelloGeotab] focus() ejecutado.");

            setText("status", "Conectado a MyGeotab.");

            getVehicles();
        }

        function blur() {
            console.info("[HelloGeotab] blur() ejecutado.");
        }

        // ============================================================
        // ADD-IN INTERFACE
        // ============================================================

        return {
            initialize: initialize,
            focus: focus,
            blur: blur
        };
    };

    console.info("[HelloGeotab] Add-In registrado correctamente.");

})();